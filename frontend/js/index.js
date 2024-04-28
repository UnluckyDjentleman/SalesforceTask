//table
$.ajax({
        url:'/contacts',
        type:'GET',
        datatype:'json',
        success:data=>{
            dataTable=data;
            FillTheTable(data, 1);
        }
});
var dataTable=[];
function FillTheTable(data, page){
    const tableBody=document.getElementById("xd");
    console.log()
    const startIndex = (page - 1) * 10; 
    const endIndex = startIndex + 10; 
    console.log(data);
    const slicedData = data.slice(startIndex,endIndex);
    console.log(slicedData);
    tableBody.innerHTML = '';
    slicedData.forEach(item=>{
        let row = tableBody.insertRow();
        let name = row.insertCell(0);
        name.innerHTML = item.Name;
        let email = row.insertCell(1);
        email.innerHTML = item.Email;
        let contactLevel = row.insertCell(2);
        contactLevel.innerHTML = item.Contact_Level__c;
        let account = row.insertCell(3);
        account.innerHTML = item.AccountId;
        let owner = row.insertCell(4);
        owner.innerHTML = item.OwnerId;
        let createdBy = row.insertCell(5);
        createdBy.innerHTML = item.CreatedById;
        let createdDate = row.insertCell(6);
        createdDate.innerHTML = item.Date__c;
        let deleteButton = row.insertCell(7);
        deleteButton.innerHTML = `<button class="btn btn-danger" id="${item.Id}" name="btn" onclick="deleteContact(\'${item.Id}\')">Delete</button>`;
    });
    updatePagination(data, page); 
}
function updatePagination(data, currentPage) { 
    const pageCount = Math.ceil(data.length / 10); 
    const paginationContainer = document.getElementById("pagination"); 
    paginationContainer.innerHTML = ""; 

    for (let i = 1; i <= pageCount; i++) { 
        const li=document.createElement("li");
        li.className='page-item'
        const pageLink = document.createElement("a"); 
        pageLink.className='page-link';
        pageLink.href = "#"; 
        pageLink.innerText = i; 
        pageLink.onclick = function () { 
            FillTheTable(data, i); 
        }; 
        if (i === currentPage) { 
            pageLink.style.fontWeight = "bold"; 
        } 
        li.appendChild(pageLink);
        paginationContainer.appendChild(li); 
        paginationContainer.appendChild(document.createTextNode(" ")); 
    } 
}
 

//modal working
function showModal(){
    $("#xdxd").modal("show");
}

function closeModal(){
    $("#xdxd").modal("hide");
}

function searchByFirstName(){
    console.log('DATA:'+dataTable);
    var xd=dataTable;
    var searchStringFirstName=$("#firstNameSearch").val();
    console.log(searchStringFirstName)
    xd=dataTable.filter(el=>el.Name.includes(searchStringFirstName));
    if(xd.length===0&&searchStringFirstName!=''){
        alert('Cannot find such first name');
        xd=dataTable;
    }
    console.log('XD:'+xd);
    FillTheTable(xd,1);
}

function searchByLastName(){
    console.log('DATA:'+dataTable);
    var xd=dataTable;
    var searchStringLastName=$("#lastNameSearch").val();
    console.log(searchStringLastName)
    xd=dataTable.filter(el=>el.Name.includes(searchStringLastName));
    if(xd.length===0&&searchStringLastName!=''){
        alert('Cannot find such string');
        xd=dataTable;
    }
    console.log('XD:'+xd);
    FillTheTable(xd,1);
}
//delete contact
async function deleteContact(id){
    console.log('ID:'+id);
    await fetch(`/delete-contact/${id}`,{
        method: 'DELETE'
    }).then(resp=>resp.json()).then(()=>window.location.href="/");
}
//fill account
let selectAccs;
$.ajax({
    url:'/accounts',
    type:'GET',
    datatype:'json',
    success:data=>{
        console.log(data);
        selectAccs=document.getElementById("selectAccount");
        data.forEach(el=>{
            var opt=document.createElement('option')
            opt.value=el.Id;
            opt.text=el.Name;
            selectAccs.appendChild(opt);
        })
    }
})

//pick value of acc option
let selectedAccId
$("#selectAccount").on('change',()=>{
    selecteAccId=$("#selectAccount").val();
})
let selectedContactLevel
$("#select-level").on('change',()=>{
    selectedContactLevel=$("#select-level").find(":selected").text();
})
let none;
async function sendData(){
    await fetch('/new-contact',{
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            firstName: $("#first_name").val(),
            lastName: $("#last_name").val(),
            email: $("#acc_email").val(),
            ContactLevel: $("#select-level").find(":selected").text(),
            accountId: $("#selectAccount").val()
        })
    }).then(resp=>resp.json()).then(()=>window.location.href('/'));
}

//sort table
let clicker=0; //control asc/desc sort
function sort(columnIndex){
    clicker=clicker+1;
    let table, rows, switching, i, x, y, shouldSwitch;
    table = document.getElementById("table");
    switching = true;

    while (switching) {
      switching = false;
      rows = table.rows;
      for (i = 1; i < rows.length - 1; i++) {
            shouldSwitch = false;
            x = rows[i].getElementsByTagName("td")[columnIndex];
            y = rows[i + 1].getElementsByTagName("td")[columnIndex];
            if(clicker%2==1&&clicker){
                if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                    shouldSwitch = true;
                    break;
                }
            }
            else{
                if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
                    shouldSwitch = true;
                    break;
                }
            }
      }

      if (shouldSwitch) {
        rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
        switching = true;
      }
    }
}
