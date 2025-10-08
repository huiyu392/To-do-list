//整個HTML文黨家載完成 並渲染到窗口時觸發
window.onload = function() {
   var table= document.querySelectorAll('#listTable tbody tr');
   // 遍歷row
   table.forEach(function(row) {
        var dateCell = row.querySelector("td:nth-child(2)");
        var pinCell = row.querySelector("td:nth-child(3)");
        var pinBtn = pinCell.querySelector('.pinBtn');
        var icon = pinBtn.querySelector('i');

        // 检查日期是否過期 (如果過期，文字設红色)
        if (isExpired(dateCell.textContent)) { 
            dateCell.style.color = '#CF3E3E'; 
            pinBtn.remove();//移除按鈕
        }

        //檢查是否釘選 (如釘選，圖標為藍
        var isPinned = pinBtn.getAttribute('itempin');
        if (isPinned == "1") {
            icon.style.color ="#8DC0CA"; //變藍
        } else {
            icon.style.color ="#DDDBDB"; //變灰
        }

    });
    sortList();
};
//創建icon按鈕
function createIconBtn(btnClassList,iconClassList,iconStyle){
    
    console.log("js createIconBtn()觸發");//* */
    var Btn = document.createElement("button");
    Btn.classList.add(btnClassList);

    var icon = document.createElement("i");
    icon.classList.add(...iconClassList); //...将數組中的元素 展开成逗号分隔的参數序列
    icon.style = iconStyle;  
    Btn.appendChild(icon);
    Btn.icon = icon; //icon 元素賦值給了按鈕元素 Btn 的 icon 屬性
    return Btn;
}
//檢查是否過期
function isExpired(date){
    // get、解析今天的日期
    var todayDate = new Date().setHours(0, 0, 0, 0); // 将时间部分设为零，只比较日期部分
    var rowDate = new Date(date).setHours(0, 0, 0, 0); 
    // 检查日期是否过期
    if (rowDate <todayDate) return true; 
    else return false;
}

//排序清單
function sortList(){
    var sort = document.getElementById("sort").value;
    var table = document.getElementById("listTable");
    var rowsArray = Array.from(table.rows).slice(1); //將table的rows屬性(第1至最終項)轉為Array
    
    //分類
    var expiredRows = [];
    var pinnedRows = [];
    var unpinnedRows = [];
    rowsArray.forEach(function(r) {
        var rowDate = r.cells[1].textContent;
        var isPinned = r.querySelector('.pinBtn')?.getAttribute('itempin'); //獲取具有 CSS 類名為 pinBtn 的元素的 itempin 屬性值

        if (isExpired(rowDate)){
            expiredRows.push(r);
        }else if (isPinned == "1") {
            pinnedRows.push(r);
        }else {
            unpinnedRows.push(r);
        }
    });

    // 過期日期 不受排序影響(過期越久排前面)
    var compareDate = function(rowA,rowB){
        var todayDate = new Date().setHours(0,0,0,0);
        var rowDateA = new Date(rowA.cells[1].textContent).setHours(0,0,0,0);
        var rowDateB = new Date(rowB.cells[1].textContent).setHours(0,0,0,0);
        if (rowDateA < todayDate || rowDateB < todayDate) {
            //最久遠的在前
            if (rowDateA < rowDateB) {
                return -1;
            }else if (rowDateA > rowDateB) {
                return 1;
            }
        }
    };
    
    //以優先級排列
    var compare = function (rowA,rowB){
        var priorityValue = {"一般":1, "中級":2, "緊急":3}; //映射優先級為數字
        var priporityA = priorityValue[rowA.cells[5].textContent]; //映射到對應值
        var priortityB = priorityValue[rowB.cells[5].textContent];
        var dateA = new Date(rowA.cells[1].textContent);
        var dateB = new Date(rowB.cells[1].textContent);

        if(sort == "緊急優先"){
            return priortityB - priporityA; //降序(緊急、中級、一般)
        }else if (sort == "一般優先") {
            return priporityA - priortityB; //升序(一般、中級、緊急)
        }else if (sort == "時間順序"){
            return dateA - dateB;
        }else if (sort == "時間倒序"){
            return dateB - dateA;
        }
    };
    //個別排序 已釘選/未釘選 項目
    expiredRows.sort(compareDate);
    pinnedRows.sort(compare);     
    unpinnedRows.sort(compare);

    //合併 array
    var sortedRows = expiredRows.concat(pinnedRows, unpinnedRows); 
    
    // 清空表格主體
    var tbody = table.querySelector('tbody');
    tbody.innerHTML = '';

    // 將排序後的行依序添加到表格主體中
    sortedRows.forEach(function(r) {
        tbody.appendChild(r);
    });

}
    
//查詢功能----------------------
// 获取输入框元素
var searchInput= document.getElementById("searchInput"); 
var searchPriority = document.getElementById("searchPriority"); 
var dateStart = document.getElementById("dateStart"); 
var dateEnd = document.getElementById("dateEnd");

//當輸入框變化，就呼叫函數
searchInput.addEventListener('input', updateTable);
searchPriority.addEventListener('input', updateTable); 
dateStart.addEventListener('input', updateTable);
dateEnd .addEventListener('input', updateTable);

function updateTable() {
    // get 输入框内容
    var keywordFilter= searchInput.value.toLowerCase();//for關鍵字搜尋(不論大小寫都能查到)
    var priorityFilter = searchPriority.value; //for優先級篩選
    var startDate = dateStart.value;//for日期篩選 (格式YYYY-MM-DD)
    var endDate = dateEnd.value;

    // 遍歷row，決定該行顯示/隱藏
    var rows = document.querySelectorAll('#listTable tbody tr');
    rows.forEach(function(row) { //tr cells 索引從0開始
        var rowDate = row.cells[1].textContent;
        var rowContent = row.cells[3].textContent.toLowerCase(); 
        var rowPerson = row.cells[4].textContent.toLowerCase(); 
        var rowPriority = row.cells[5].textContent;

        //關鍵字查詢 顯示條件
        var condition1 = keywordFilter === '' || 
                        rowPerson.includes(keywordFilter) ||
                         rowContent.includes(keywordFilter);
        //優先擊查詢 顯示條件
        var condition2 = priorityFilter === '' || 
                        rowPriority.includes(priorityFilter);
        //日期範圍查詢 顯示條件
        var condition3 = (startDate === '' && endDate === '') ||
                        (startDate === '' && rowDate <= endDate) ||
                        (endDate === '' && rowDate >= startDate) ||
                        (rowDate >= startDate && rowDate <= endDate);

        if (condition1 && condition2 && condition3){
            row.style.display = ''; //顯示
        } else {
            row.style.display = 'none'; //隱藏
        }
    });
}

// HTML 文檔的所有內容都加載完成後觸發
document.addEventListener('DOMContentLoaded', function () {
    console.log("document.addEventListener觸發");// */

    //獲取輸入框元素
    const inputDate = document.getElementById("inputDate");
    const inputContent = document.getElementById("inputContent");
    const inputPerson = document.getElementById("inputPerson");
    const selectPriority = document.getElementById("selectPriority");
 
    //按鈕觸發事件
    const btn_add = document.getElementById("btn_add"); 
    btn_add.addEventListener('click', function () {
        //獲取輸入框元素 內容
        var date = inputDate.value.trim();
        var content = inputContent.value.trim();
        var person = inputPerson.value.trim();
        var priority = selectPriority.value.trim();
        if (content && person) { 
            addRequest(date, content, person, priority);          
            //清空輸入框
            inputDate.value = '';
            inputContent.value = '';
            inputPerson.value = '';
            selectPriority.value = '一般';
        } else {
            alert('請至少填寫\"項目內容\"、\"負責人\"');
        }
    });
});


//新增請求，新增到資料庫
function addRequest(date, content, person, priority) {

    //將數據組合成 JSON 格式
    const data = {
        date:date, 
        content:content, 
        person:person,  
        priority:priority
    }; 
    
    //對後端 發出post reuqeset (將data送出前轉換成josn格式再送出)
    fetch('/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json' //指定請求頭為 JSON 格式
        },
        body: JSON.stringify(data) //將數據轉換為 JSON 字符串
    })
    //將收到的resopnse 
    .then(response => response.json())  //轉成josn格式
    .then(data => {
        ////console.log(data); // 打印從服務器接收到的數據
        if (data.success) { //if data中有
            console.log('addRequest successed');
            addRow(data.item);
            
        } else {
            alert('addRequest failed');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}
//前端新增
function addRow(responseItem) {

    //檢查輸入日期是否過期-變色
    var color = isExpired(responseItem.date)? '#CF3E3E' : 'black'; 
    const table = document.getElementById("listTable");
    var newRow = table.insertRow(-1); //插入到最後一項
    
    //加入Cell，並填入資料
    var checkCell = newRow.insertCell(0);
    var dateCell = newRow.insertCell(1);
    var pinCell = newRow.insertCell(2)
    var contentCell = newRow.insertCell(3);
    var personCell = newRow.insertCell(4);
    var priorityCell = newRow.insertCell(5);
    var editCell = newRow.insertCell(6);
    var deleteCell = newRow.insertCell(7);
    dateCell.textContent = responseItem.date; dateCell.style.color=color; // 過期變色
    contentCell.textContent = responseItem.content;
    personCell.textContent = responseItem.person;
    priorityCell.textContent = responseItem.priority;

    sortList();//排序

    //添加 完成勾選框
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.classList.add("checkbox");
    checkbox.setAttribute('itemid', responseItem.id);
    checkbox.addEventListener("click",function(){ deleteRow(checkbox) }); //完成刪除
    checkCell.appendChild(checkbox);
   
    //添加 釘選鍵(icon)  (#過期不可釘選)
    if(isExpired(responseItem.date) == false){
        var pinBtn = createIconBtn("pinBtn",["fa-solid", "fa-thumbtack","fa-rotate-by", "fa-xl"],"color: #DDDBDB;  --fa-rotate-angle: 30deg");
        pinBtn.isPinned = false;//預設屬性 未釘選
        pinBtn.setAttribute('itemid', responseItem.id);
        pinBtn.addEventListener("click",function(){ pinRow(pinBtn, pinBtn.isPinned)});
        pinCell.appendChild(pinBtn);
    }   
    //添加 編輯鍵(icon)
    var editBtn = createIconBtn("editBtn",["fa-solid","fa-pen-to-square","fa-xl"],"color:#999897");        
    editBtn.setAttribute('itemid', responseItem.id);
    editBtn.addEventListener("click",function(){ editRow(editBtn) });
    editCell.appendChild(editBtn);
       
    //添加 刪除鍵(icon)
    var deleteBtn = createIconBtn("deleteBtn",["fa-solid", "fa-trash", "fa-xl"],"color:#999897");
    deleteBtn.setAttribute('itemid', responseItem.id);
    deleteBtn.addEventListener("click",function(){ deleteRow(deleteBtn) });
    deleteCell.appendChild(deleteBtn);
   
}


//前端刪除
function deleteRow(deletebtn){
    console.log("js deleteRow()觸發");
    
    var row = deletebtn.closest("tr");  
    row.parentNode.removeChild(row);  //removeChild() 是table方法
    deleteRequest(deletebtn);
}
//刪除請求
function deleteRequest(deletebtn) {
    var id = deletebtn.getAttribute('itemid');
    
    fetch('/delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({id:id}) //JSON 格式
    })
    //將收到的resopnse 
    .then(response => response.json())
    .then(data => {
        console.log(data);
        if (data.success) {
            console.log('deleteRequest successed');
        
        } else {
            alert('deleteRequest failed');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}


//前端編輯
function editRow(editbtn) {
    const row = editbtn.closest("tr");
    
    //編輯中的row，變灰色
    var cells = row.getElementsByTagName("td");
    for (var i = 0; i < cells.length; i++) {cells[i].style= "background-color:#F3EEE9;";}
    
    //獲取元素
    const dateCell = row.querySelector("td:nth-child(2)");
    const pinCell = row.querySelector("td:nth-child(3)");
    const contentCell = row.querySelector("td:nth-child(4)");
    const personCell = row.querySelector("td:nth-child(5)"); 
    const priorityCell = row.querySelector("td:nth-child(6)");
    
    //獲取 編輯前的原始內容 - 表格欄位內容(textContent)
    var orgdate = dateCell.textContent;
    var orgcontent = contentCell.textContent;
    var orgperson = personCell.textContent;
    var orgpriority = priorityCell.textContent;
    
    //欄位變成可編輯框
        //date編輯框
        var dateinput = document.createElement("input");
        dateinput.classList.add("dateinput");
        dateinput.type = 'date';
        dateinput.value = orgdate; //輸入框(value) 套入原始內容
        dateCell.textContent =""; //清空 表格cell內容(textContent)
        dateCell.appendChild(dateinput); //輸入框放入 cell
        //content編輯框
        var contentinput = document.createElement("input"); 
        contentinput.classList.add("contentinput");
        contentinput.type = 'text';
        contentinput.value = orgcontent ; //輸入框(value) 套入原始內容
        contentCell.textContent =""; //清空 表格cell內容(textContent)
        contentCell.appendChild(contentinput);//輸入框放入 cell
        //person編輯框
        var personinput = document.createElement("input");
        personinput.classList.add("personinput");
        personinput.type = 'type';
        personinput.value = orgperson; //輸入框 套入原始內容
        personCell.textContent = "";//輸入框 套入原始內容
        personCell.appendChild(personinput);//輸入框放入 cell
        
        //將優先級文字改為下拉表單
        var sortselect = document.createElement("select");
        sortselect.classList.add("sortselect");
        var normal = document.createElement("option");
        normal.value ="一般";
        normal.textContent="一般";
        var middle = document.createElement("option");
        middle.value = "中級";
        middle.textContent="中級";
        var urgent = document.createElement("option");
        urgent.value = "緊急";
        urgent.textContent = "緊急";
        
        if (priorityCell.textContent =="一般"){
            normal.selected = true;
        } else if (priorityCell.textContent == "中級"){
            middle.selected = true;
        }else{
            urgent.selected = true;
        }
        sortselect.appendChild(normal);
        sortselect.appendChild(middle);
        sortselect.appendChild(urgent);

        priorityCell.textContent = "";
        priorityCell.appendChild(sortselect);
    
    //清掉 編輯鍵 
    const editCell = row.querySelector("td:nth-child(7)");
    editCell.textContent = ""; 
    
    //添加 確認按鈕
    var saveBtn = createIconBtn("saveBtn",["fa-solid","fa-check","fa-xl"],"color:#999897");
    saveBtn.addEventListener("click",function(){

        //獲得草稿 (當前輸入框邊輯的內容)
        var draft_date = dateinput.value;
        var draft_content = contentinput.value;
        var draft_person = personinput.value;
        var draft_priority = sortselect.value;
        if(draft_content.trim() != ""&& draft_person.trim() != ""){
            //恢復色彩
            var row = saveBtn.closest("tr");
            var cells = row.getElementsByTagName("td");
            for (var i = 0; i < cells.length; i++) {cells[i].style= "background-color:#FFFFFF;";} 
            
             
            //呼叫 將修改後的資料發送給後端
            var id = editbtn.getAttribute('itemid');  //獲得該列id
            var responseId = editRequest(id, draft_date, draft_content, draft_person, draft_priority); 
             
            //檢查輸入日期是否過期-決定顏色   
            var color = isExpired(draft_date)? '#CF3E3E' : 'black';  
 
            //草稿存入欄位
            dateCell.textContent = draft_date;
            dateCell.style.color=color; // 過期變色
            contentCell.textContent = draft_content;
            personCell.textContent = draft_person;
            priorityCell.textContent = draft_priority;

            //過期 刪除釘選鍵
            if(!isExpired(orgdate) && isExpired(draft_date)){
                pinCell.textContent="";

            }else if (isExpired(orgdate) && !isExpired(draft_date)){

                //添加 釘選鍵(icon) 
                var pinBtn = createIconBtn("pinBtn",["fa-solid", "fa-thumbtack","fa-rotate-by", "fa-xl"],"color: #DDDBDB;  --fa-rotate-angle: 30deg");
                pinBtn.isPinned = false;//預設屬性 未釘選
                pinBtn.setAttribute('itemid', responseId);
                pinBtn.addEventListener("click",function(){ pinRow(pinBtn, pinBtn.isPinned)});
                pinCell.appendChild(pinBtn);
            }
            sortList();//重新整理table
        
        }else{
            alert("請至少填寫\"項目內容\"、\"負責人\"");
            return;
        } 
        //恢復編輯鍵
        editCell.textContent = "";
        editCell.appendChild(editbtn);
    });
    editCell.appendChild(saveBtn);
   
    //與 取消按鈕
    var cancelBtn = createIconBtn("cancelBtn",["fa-solid","fa-xmark","fa-xl"],"color:#999897");
    cancelBtn.addEventListener("click",function(){

        var row = cancelBtn.closest("tr");
        var cells = row.getElementsByTagName("td");
        //恢復色彩
        for (var i = 0; i < cells.length; i++) {cells[i].style= "background-color:#FFFFFF;";}

        // 欄位放入原內容
        dateCell.textContent = orgdate;
        contentCell.textContent = orgcontent;
        personCell.textContent = orgperson;
        priorityCell.textContent = orgpriority;

        //恢復編輯鍵
        editCell.textContent = "";
        editCell.appendChild(editbtn);        
    });
    editCell.appendChild(cancelBtn);
}
//編輯請求
function editRequest(id, date, content, person, priority) {
    const data = {
        id: id,  // 傳遞項目的ID
        date:date,
        content: content, 
        person: person,
        priority:priority,
    }; 
    fetch('/edit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data) // 将数据转换为 JSON 字符串
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        if (data.success) {
            console.log('editRequest successed');
            return data.item.id;
        } else {
            alert('editRequest failed');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });

}

//前端釘選
function pinRow(pinbtn){
    var icon = pinbtn.querySelector('i');
    var isPinned = pinbtn.getAttribute('itempin');
    
    //切換釘選狀態
    newPinStatus = (isPinned == 1)? '0' : '1';  
    pinbtn.setAttribute('itempin', newPinStatus);
    
    //依狀態 改圖標顏色
    if(newPinStatus == '1'){//釘選
        icon.style.color ="#8DC0CA"; //變藍  
    }else{//未釘選
        icon.style.color ="#DDDBDB"; //變灰
    }

    sortList(); //排序(釘選置頂)
    pinRequest(pinbtn, newPinStatus); 
}
//切換釘選狀態請求
function pinRequest(pinbtn, newPinStatus) {
    
    var id = pinbtn.getAttribute('itemid');
    const data={
        id: id,
        pinned: newPinStatus, 
    }
    fetch('/pin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('pinRequest successed');
        } else {
            alert('pinRequest failed');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}