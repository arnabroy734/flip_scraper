//$SCRIPT_ROOT = {{ request.script_root|tojson }};

let timeout = 5
let loader_timer = 0

// jQuery 
$('document').ready(function(){
    //by default hide "#selector_items"
    $('#selector_items').hide()

    // when you click "selector_container" "#selector_items" will show 
    $('#selector_container').click(function(){
        $('#selector_items').show()
        // console.log("I am entering")
    })

    // when you leave "#selector_items" it will hide
    $('#selector_items').mouseleave(function(){
        $('#selector_items').hide()
        // console.log("I am leaving")
    })

    //when you click "#timeout_list":
    $('#timeout_list').click(function(element){
        if(element.target != null){
            var time = "Timeout - " + document.getElementById(element.target.id).innerHTML;
            // console.log(time);
            $("#selector").html(time)
            $('#selector_items').hide()
            timeout = parseInt(element.target.id)
            // console.log("Timeout "+timeout )
        }
    }) 

    //search when user press enter in search box
    $("#input_search").keypress(function(e){
        if (e.which == 13)
            buttonClickedSearch()
    })

    // //table to excel
    $('#button_export').click(function(){
        console.log('clicked')
        var table = $('#product_table').clone()
        $(table).find("tr td a").replaceWith(function(){
            // console.log($(this).attr('href'))
            return '=HYPERLINK("' + $(this).attr('href').split('&lid=')[0] + '", "Go to Flipkart")';
        });
        $(table).table2excel({
            name: "MyTable",
            filename:"product.xls",
            exclude_links: true,
            fileext:'.xls'
        });
        
    })
    
})



function buttonClickedSearch(){
    // document.getElementById("input_search").value = 'NONE'
    // var textSearch = document.getElementById("input_search").value
    // document.getElementById('content').innerHTML = textSearch

    // experiment with fetch API

//    const API_URL = 'http://127.0.0.1:8000/'
    const API_URL = '/'
    const PRODUCT_LINKS = []

    function getUrlFromSearchKey(){
        var textSearch = document.getElementById("input_search").value;
        if (textSearch.length == 0)
            return null;
        else
            return API_URL+"time="+timeout+"/key="+textSearch ;
    }

    function validateResponse(response){
        if (!response.ok)
            console.log("BAD RESPONSE");
        else{
            console.log(response.url);
            return response.json();
        }
    }

    function readProductLinks (responseAsJson){
        
        // storing the product links in array  - PRODUCT_LINKS
        for (i=0; i<responseAsJson.length; i++)
            PRODUCT_LINKS.push(responseAsJson[i]["Product Link"])

        // document.getElementById('content').innerHTML = jsonText;
        jsonText = JSON.stringify(responseAsJson)
        console.log(jsonText)
        // console.log(PRODUCT_LINKS)
        for (i=0; i<PRODUCT_LINKS.length; i++){
            // console.log(API_URL + "p/" +PRODUCT_LINKS[i])
            fetchProductDetails(API_URL + "p/" +PRODUCT_LINKS[i])
        }
            

    }

    function readProductDetails(responseAsJson){
        // jsonText = JSON.stringify(responseAsJson)
        // console.log(jsonText)
        for (i=0; i<responseAsJson.length; i++){
            var name = responseAsJson[i]["name"]
            var price = responseAsJson[i]["price"]
            var rating = responseAsJson[i]["rating"]
            var ratings = responseAsJson[i]["ratings"]
            var link = responseAsJson[i]["link"]

            manipulateTable(name, price, rating, ratings, link)
        }

        loader_timer = 0 //this will stop the loader immediately
        
        
    }

    function handleError(error){
        console.log("Error is "+ error)
        // document.getElementById('content').innerHTML = "Something Went Wrong";
    }

    // function fetchProductLinks(apiUrl){
    //     fetch(apiUrl).
    //     then(validateResponse).
    //     then(readProductLinks).
    //     catch(handleError)
    // }

    function fetchProductDetails(apiUrl){
        fetch(apiUrl).
        then(validateResponse).
        then(readProductDetails).
        catch(handleError)
    }


    // vadilate the input and create search url 
    if (getUrlFromSearchKey() == null){
        alert("search box is empty")
        return false;
    }
    else{
        var search_url = getUrlFromSearchKey(); 
        console.log(search_url);
        // fetchProductLinks(search_url) 
        deleteTable()
        loader_timer = timeout //loader timer set to timeout 
        loadData()
        fetchProductDetails(search_url)  
    }
        
   
}

function manipulateTable(name, price, rating, ratings, link){
    var table = document.getElementById('product_table')
    var new_row = table.insertRow(table.rows.length)
    cell1 = new_row.insertCell(0)
    cell2 = new_row.insertCell(1)
    cell3 = new_row.insertCell(2)
    cell4 = new_row.insertCell(3)
    cell5 = new_row.insertCell(4)

    cell1.innerHTML = name
    cell2.innerHTML = price
    cell3.innerHTML = rating
    cell4.innerHTML = ratings

    var p_link = document.createElement('a')
    p_link.setAttribute('href', link)
    p_link.setAttribute('target', '_blank')
    var linkText = document.createTextNode('Go to Flipkart')
    p_link.appendChild(linkText)

    cell5.appendChild(p_link)
    
}

function deleteTable(){
    var table = document.getElementById('product_table');
    for (i=table.rows.length-1; i>1; i--){
        console.log("deleting")
        table.deleteRow(i)
    }
}

function loadData(){
    var loader = document.getElementById("loader");
    var table_container = document.getElementById("table_container")
    var loader_text = document.getElementById("loading_text")
    var search_button = document.getElementById("button_search")
    
    //delete all table rows and set table as hidden 
    deleteTable()
    table_container.style.visibility = "hidden"

    //make ther loader visible
    loader.style.visibility = "visible"
    loader_text.innerHTML = "Waiting for .."

    //make search button disabled
    search_button.disabled = true

    //after the timeout make loader hidden and table visible again
    var loopinterval = setInterval(function(){
        if(loader_timer == 0){
            loader.style.visibility = "hidden"
            table_container.style.visibility = "visible"
            search_button.disabled = false
            clearInterval(loopinterval)
        }
        loadingText = "Waiting for "+loader_timer+" seconds"
        loader_text.innerHTML = loadingText
        loader_timer--
    }, 1000)

    
        
}