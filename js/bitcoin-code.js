(function() {
    
    var setup = function() {
        var download_button = $(Settings.download_button);
        var play_button = $(Settings.play_button);
        var both_buttons = $(Settings.download_button + "," + Settings.play_button);
        var address_input = $(Settings.address_input);
        var earliest_date = new Date(Settings.earliest_date);
        var timed_task;
        
        $(Settings.donate_address_display).text(Settings.donate_address);
        
        function setDownloadActive() {
            both_buttons.removeClass("no-address");
            both_buttons.removeAttr("disabled");
            download_button.click(function(e) {
                e.preventDefault();  //stop the browser from following
                window.location.href = Settings.download_location;
            })
        }
        
        function getEarliestTransaction(transactions) {
            return transactions[transactions.length - 1];
        }
        
        function addressInTransactions(address, transactions) {
            for(var i = 0, e = transactions.length; i < e; tx = ++i) {
                var tx = transactions[i];
                if ($.inArray(address, tx["addresses"]) != -1) {
                    setDownloadActive();
                    return true;
                }
            }
            return false;
        }
        
        function isBeforeEarliest(transactions) {
            var tx = getEarliestTransaction(transactions);
            return new Date(tx["confirmed"]) < earliest_date;
        }
        
        function doFind (userAddr, callback, more) {
            var args;
            if (Settings && Settings.token) {
                args = { token: Settings.token };
            } else {
                args = {};
            }
            
            if (more) { args["before"] = more; }
            
            $.get("http://api.blockcypher.com/v1/btc/main/addrs/" + userAddr + "/full", args, callback);
        }
        
        function startTimedTask(userAddr) {
            var addr = userAddr;
            timed_task = setInterval(function() {
                console.log("Checking for new transactions.");
                findAddrInNewestTransactions(addr);
            }, 120000);
        }
       
        
        function findAddrInNewestTransactions(userAddr) {
            doFind(userAddr, function(data) {
                var transactions = data["txs"];
                if(addressInTransactions(Settings.donate_address, transactions)) {
                    setDownloadActive();
                    console.log("Transaction found between " + userAddr + " and " + Settings.donate_address);
                    clearInterval(timed_task);
                }
            });
        }
        
        function findAddrInAllTransactions(userAddr) {
            function continueFinding(data) {
                var transactions = data["txs"];
                if(addressInTransactions(Settings.donate_address, transactions)) {
                    setDownloadActive();
                    console.log("Transaction found between " + userAddr + " and " + Settings.donate_address);
                } else {
                    if (data["hasMore"] && transactions && !isBeforeEarliest(transactions)) {
                        //didn't return so hasn't found address
                        var lastTx = transactions[transactions.length - 1];
                        doFind(userAddr, continueFinding, getEarliestTransaction(transactions)["block_height"]);
                    } else {
                        console.log("No transactions found between " + userAddr + " and " + Settings.donate_address);
                        startTimedTask(userAddr);
                    }
                }
            }
            
            doFind(userAddr, continueFinding);
        }
        
        address_input.on("input", function() {
            var val = $(this).val();
            if(check_address(val)) {
                //valid
                address_input.removeClass("invalid");
                address_input.addClass("valid");
                both_buttons.removeClass("no-address");
                
                findAddrInAllTransactions(val);
            } else {
                //invalid
                address_input.addClass("invalid");
                address_input.removeClass("valid");
                both_buttons.addClass("no-address");
                clearInterval(timed_task);
            }
        });
    };
    
    
    function set_defaults(obj) {
        Settings.download_button = Settings.download_button || "#song-download-button";
        Settings.play_button = Settings.play_button || "#song-play-button"
        Settings.address_input = Settings.address_input || "#bitcoin-donator-address";
        Settings.donate_address_display = Settings.donate_address_display || "#donate-address";
        Settings.donate_address = Settings.donate_address || "1PZ5ebvdt43dvRRgRNgBhsq2PwAKN4X6W";
        Settings.earliest_date = Settings.earliest_date || "2015-06-01";
        Settings.download_location = Settings.download_location || "http://freedownloads.last.fm/download/626522452/Flow.mp3";
    }

    if (window.Settings) {
        set_defaults(window.Settings);
        $(setup);
    } else {
        window.Settings = {};
        $.get("settings.json")
            .done(function(data) {
                Settings = data;
            })
            .fail(function() {
                console.log("No settings found, using defaults.");
            })
            .always(function() {
                set_defaults(window.Settings);
                $(setup);
            });
    }
})();