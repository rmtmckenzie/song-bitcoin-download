
$(function() {
    var download_button = $("#song-download-button");
    var address_input = $("#bitcoin-donator-address");
    address_input.on("input", function() {
        var val = $(this).val();
        if(check_address(val)) {
            //valid
            address_input.removeClass("invalid");
            address_input.addClass("valid");
            download_button.removeClass("no-address");
            
            $.get("https://blockchain.info/address/" + val, function( data ) {
                var transactions = data["txs"];
                console.log(transactions);
            });
        } else {
            //invalid
            address_input.addClass("invalid");
            address_input.removeClass("valid");
            download_button.addClass("no-address");
        }
        //console.log($(this).val());
    });
    
    
    
});