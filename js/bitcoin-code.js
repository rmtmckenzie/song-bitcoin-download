(function() {
    
    
    function getEarliestTransaction(transactions) {
            return transactions[transactions.length - 1];
    }
    
    function addressInTransactions(address, transactions) {
        for(var i = 0, e = transactions.length; i < e; tx = ++i) {
            var tx = transactions[i];
            if ($.inArray(address, tx["addresses"]) != -1) {
                return true;
            }
        }
        return false;
    }
 
    function startTimed(callback, time) {
        return setInterval(function() {
            callback();
        }, time);
    }
    
    var Settings = {
        download_button: "#song-download-button",
        play_button: "#song-play-button",
        address_input: "#bitcoin-donator-address",
        earliest_date: "2015-06-01",
        download_location: "http://freedownloads.last.fm/download/626522452/Flow.mp3",
        donate_address: "1PZ5ebvdt43dvRRgRNgBhsq2PwAKN4X6W"
    }
 
    var BitcoinChecker = {
        addressInvalid: function() {
            $(Settings.download_button).addClass("no-address");
            $(Settings.address_input).addClass("invalid").removeClass("valid");
        },
        addressValid: function() {
            $(Settings.download_button).removeClass("no-address");
            $(Settings.address_input).removeClass("invalid").addClass("valid");
        },
        downloadEnabled: function() {
            $(Settings.download_button)
                .removeClass("no-address")
                .removeAttr("disabled");
        },
        downloadDisabled: function() {
            $(Settings.download_button)
                .attr("disabled","true");
        },
        downloadClicked: function() {
            //window.location.href = Settings.download_location;
            alert("The song would start downloading now on the real site.")
        }
    }
    
    var Bitcoin = {
        setup: function() {
            var _this = this;
            this.address_valid = true; // force to set invalid on first entry
            $(Settings.address_input).on("input", function() {
                var val = $(this).val();
                if(check_address_is_bitcoin(val)) {
                    //valid
                    _this.addressValid(val);

                } else {
                    //invalid
                    _this.addressInvalid();
                }
            });
            
        },
        addressValid: function(val) {
            this.address_valid = true;
            BitcoinChecker.addressValid();
            clearInterval(this.timed_task); // in case go from valid to valid
            this.findAddrInAllTransactions(val);
        },
        addressInvalid: function() {
            if (this.address_valid) {
                this.address_valid = false;
                BitcoinChecker.addressInvalid();
                this.disableDownload();
                clearInterval(this.timed_task);
            }
        },
        enableDownload: function() {
            this.download_enabled = true;
            BitcoinChecker.downloadEnabled();
            $(Settings.download_button)
                .click(function(e) {
                    e.preventDefault();  //stop the browser from following
                    BitcoinChecker.downloadClicked();
                });
        },
        disableDownload: function() {
            if (this.download_enabled) {
                this.download_enabled = false;
                BitcoinChecker.downloadDisabled();
                $(Settings.download_button)
                    .off("click")
            }
        },
        isBeforeEarliest: function(transactions) {
            var tx = getEarliestTransaction(transactions);
            return new Date(tx["confirmed"]) < new Date(Settings.earliest_date);
        },
        doFind: function(userAddr, callback, more) {
            var args;
            if (BitcoinChecker.token) {
                args = { token: BitcoinChecker.token };
            } else {
                args = {};
            }
            
            if (more) { args["before"] = more; }
            
            $.get("http://api.blockcypher.com/v1/btc/main/addrs/" + userAddr + "/full", args, callback);
        },
        findAddrInNewestTransactions: function(userAddr) {
            var _this = this;
            this.doFind(userAddr, function(data) {
                var transactions = data["txs"];
                if(addressInTransactions(Settings.donate_address, transactions)) {
                    _this.enableDownload();
                    console.log("Transaction found between " + userAddr + " and " + Settings.donate_address);
                    clearInterval(_this.timed_task);
                }
            });
        },
        findAddrInAllTransactions: function(userAddr) {
            var _this = this;
            function continueFinding(data) {
                var transactions = data["txs"];
                if(addressInTransactions(Settings.donate_address, transactions)) {
                    _this.enableDownload();
                    console.log("Transaction found between " + userAddr + " and " + Settings.donate_address);
                } else {
                    if (data["hasMore"] && transactions && !_this.isBeforeEarliest(transactions)) {
                        //didn't return so hasn't found address
                        _this.doFind(userAddr, continueFinding, getEarliestTransaction(transactions)["block_height"]);
                    } else {
                        console.log("No transactions found between " + userAddr + " and " + Settings.donate_address);
                        _this.timed_task = startTimed(function() {
                            _this.findAddrInNewestTransactions(userAddr);
                        }, 120000);
                    }
                }
            }
            this.doFind(userAddr, continueFinding);
        }
    }
    
    window.BitcoinChecker = BitcoinChecker;
    $(function(){Bitcoin.setup()});
    
})();