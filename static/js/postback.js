/**
 * Created by wpalin on 2/6/17.
 */
function postdata(strin) {
    // alert(strin)
    // Post parameters to postdata and get returned_data
    $.post("/postdata/",

        {posted_data: JSON.stringify(strin)},
        function (direction) {
            // alert(direction)


        }
    );
}