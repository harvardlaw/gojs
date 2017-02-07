/**
 * Created by wpalin on 1/25/17.
 */

function passdata() {
    var text2 = $("#mySavedModel").val();
    var x = document.getElementById('mySavedModel');
    var dict = {};
    // alert('saving coming')
    dict['q'] = text2;

    $.post( "/mainpost", {
        all_data:JSON.stringify(dict)},
        function( data ) {
        // alert(data)
        //     $('newdiv').innerHTML = 'Your text.';
        //     document.body.insertAdjacentHTML( 'newdiv', '<div id="myID">asdfasdfadasdfafd</div>' );
        //     alert(data)
            // $("textarea").after(txt1, txt2, txt3);
            // $("#newdiv").html(data);
    });
}
