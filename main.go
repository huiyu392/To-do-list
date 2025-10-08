/*
- 點出，所有相通功能應該是同名，因為使用者會看，同義不同名使用者會混亂
- 輸入過長時(可能導致資料庫窗戶)，前端應限制後端應檢查，盡量在進入資料庫之前()
- (因為多數使用者習慣)，希望盡量要輸入的放一區

面相多人代辦事項(重要事項)
- 完成應提出彈窗，確認完成事項(double check)
- 描述欄位 要補上(多人會放上細項分工)

補充:
TEXT(M)	M+2 Byte	65535 字
*/

package main

import ( //import the driver and can use the full database/sql API
	"database/sql"
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"net/http" //提供客戶端跟主機端的 http 方法
	"time"

	_ "github.com/go-sql-driver/mysql"
)

const (
	USERNAME = "root"
	PASSWORD = "root"
	NETWORK  = "tcp"
	SERVER   = "127.0.0.1"
	PORT     = 3306
	DATABASE = "tododb"
)

var conn string = fmt.Sprintf("%s:%s@%s(%s:%d)/%s", USERNAME, PASSWORD, NETWORK, SERVER, PORT, DATABASE)

type TodoItem struct {
	Id       string `json:"id"`
	Date     string `json:"date"`
	Pinned   string `json:"pinned"`
	Content  string `json:"content"`
	Person   string `json:"person"`
	Priority string `json:"priority"`
	Expired  bool   `json:"expired"` // 新增的字段，表示日期是否过
}

func main() {
	//http server 建置與啟動
	// 設置路由
	//http.HandleFunc("/", test)
	http.HandleFunc("/todo", handler)
	http.HandleFunc("/add", addHandler)
	http.HandleFunc("/edit", editHandler)
	http.HandleFunc("/delete", deleteHandler)
	http.HandleFunc("/pin", pinHandler)
	// 設定靜態資源的讀取
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	fmt.Println("Server is running on port 8080") //在終端機print
	log.Fatal(http.ListenAndServe(":8080", nil))  // 啟動服務器
}

// 收到對/st 請求 -> 去資料庫SELECT data -> 將結果存在response送自前端
func handler(w http.ResponseWriter, r *http.Request) {
	// 請求連接DB
	db, err := sql.Open("mysql", conn)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// SELECT
	rows, err := db.Query("SELECT id, date, content, person, priority, pinned FROM todolist")
	if err != nil {
		log.Fatal(err)
	}

	defer rows.Close()

	var todoItems []TodoItem
	// 逐行遍歷查詢結果，逐行存入list
	for rows.Next() {
		var Item TodoItem
		err := rows.Scan(&Item.Id, &Item.Date, &Item.Content, &Item.Person, &Item.Priority, &Item.Pinned)
		if err != nil {
			log.Fatal(err)
		}

		// 检查日期是否过期
		itemDate, err := time.Parse("2006-01-02", Item.Date) //Item.Date 解析为 time.Time 类型，且格式為YYYY-MM-DD
		if err != nil {
			log.Fatal(err)
		}
		Item.Expired = itemDate.Before(time.Now().UTC()) //返回当前的 UTC 时间，並比較itemDate是否比當前時間早，是(true)

		todoItems = append(todoItems, Item)
	}

	// 使用 HTML 模板來動態生成 HTML 內容
	tmpl := template.Must(template.ParseFiles("template/todo_end.html"))
	tmpl.Execute(w, todoItems)

}

// 將HTML發來的Request 做出行為 然後response
func addHandler(w http.ResponseWriter, r *http.Request) {
	// 將前端的request(post)，解析 JSON 格式的請求數據 (#注意:struct的type會有影響)
	var item TodoItem
	err := json.NewDecoder(r.Body).Decode(&item)

	if err != nil {
		http.Error(w, "Failed to parse request body", http.StatusBadRequest)
		return
	}
	// 如果日期未提供，預設值為當前日期
	if item.Date == "" {
		item.Date = time.Now().Format("2006-01-02") // 將日期設置為當日日期，格式為 YYYY-MM-DD
	}

	// 連接數據庫
	db, err := sql.Open("mysql", conn)
	if err != nil {
		http.Error(w, "Database connection error", http.StatusInternalServerError)
		return
	}
	defer db.Close()

	// 執行插入操作
	result, err := db.Exec("INSERT INTO todolist (date, content, person, priority) VALUES (?, ?, ?, ?)", item.Date, item.Content, item.Person, item.Priority)
	if err != nil {
		http.Error(w, "Failed to add student", http.StatusInternalServerError)
		return
	}

	id, err := result.LastInsertId()
	if err != nil {
		http.Error(w, "Failed to retrieve last insert id", http.StatusInternalServerError)
		return
	}

	item.Id = fmt.Sprintf("%d", id)
	item.Expired = time.Now().UTC().After(time.Now()) // 更新 expired 狀態

	response := struct {
		//結構體字面量
		Success bool     `json:"success"`
		Item    TodoItem `json:"item"`
	}{
		//結構體字面量的初始化器
		Success: true,
		Item:    item, // 返回新增的資料
	}
	// response 前端(返回成功信息)
	w.Header().Set("Content-Type", "application/json") //respons的head 設定
	json.NewEncoder(w).Encode(response)                //將結構體編碼成 JSON 格式，並將其寫入到 HTTP 回應中
}

func deleteHandler(w http.ResponseWriter, r *http.Request) {
	// 解析 JSON 格式請求
	var item TodoItem
	err := json.NewDecoder(r.Body).Decode(&item)
	if err != nil {
		http.Error(w, "Failed to parse request body", http.StatusBadRequest)
		return
	}

	// 連接DB
	db, err := sql.Open("mysql", conn)
	if err != nil {
		http.Error(w, "Database connection error", http.StatusInternalServerError)
		return
	}
	defer db.Close()

	// 执行删除操作
	_, err = db.Exec("DELETE FROM todolist WHERE id = ?", item.Id)
	if err != nil {
		http.Error(w, "Failed to delete record", http.StatusInternalServerError)
		return
	}

	// 返回成功信息
	w.Header().Set("Content-Type", "application/json")
	response := struct {
		//結構體字面量
		Success bool     `json:"success"`
		Item    TodoItem `json:"item"`
	}{
		//結構體字面量的初始化器
		Success: true,
		Item:    item, // 返回新增的資料
	}
	json.NewEncoder(w).Encode(response) //將結構體編碼成 JSON 格式，並將其寫入到 HTTP 回應中

}

func editHandler(w http.ResponseWriter, r *http.Request) {
	// 解析 JSON 格式的请求数据
	var item TodoItem
	err := json.NewDecoder(r.Body).Decode(&item)
	if err != nil {
		// 打印解析後的 JSON 數據，方便調試
		fmt.Println("Parsed JSON data:", item) //
		http.Error(w, "Failed to parse request body", http.StatusBadRequest)
		return
	}
	// 连接数据库
	db, err := sql.Open("mysql", conn)
	if err != nil {
		http.Error(w, "Database connection error", http.StatusInternalServerError)
		return
	}
	defer db.Close()

	// 执行更新操作
	_, err = db.Exec("UPDATE todolist SET date = ?, content = ?, person = ?, priority = ? WHERE id = ?", item.Date, item.Content, item.Person, item.Priority, item.Id)
	if err != nil {
		http.Error(w, "Failed to edit record", http.StatusInternalServerError)
		return
	}

	// 返回成功信息
	w.Header().Set("Content-Type", "application/json")
	response := struct {
		Success bool     `json:"success"`
		Item    TodoItem `json:"item"`
	}{
		Success: true,
		Item:    item,
	}
	json.NewEncoder(w).Encode(response)

}

func pinHandler(w http.ResponseWriter, r *http.Request) {
	// 解析 JSON 格式的请求数据
	var item TodoItem
	err := json.NewDecoder(r.Body).Decode(&item)
	if err != nil {
		http.Error(w, "Failed to parse request body", http.StatusBadRequest)
		return
	}
	// 連接DB
	db, err := sql.Open("mysql", conn)
	if err != nil {
		http.Error(w, "Database connection error", http.StatusInternalServerError)
		return
	}
	defer db.Close()
	fmt.Println("连接数据库")
	fmt.Println(item.Pinned)
	fmt.Println(item.Id)
	// 执行更新操作
	_, err = db.Exec("UPDATE todolist SET pinned = ? WHERE id = ?", item.Pinned, item.Id)
	if err != nil {
		http.Error(w, "Failed to edit record", http.StatusInternalServerError)
		return
	}
	fmt.Println("执行更新操作")

	// 返回成功信息 (JSON response)
	w.Header().Set("Content-Type", "application/json")
	//fmt.Fprintf(w, `{"success": true}`)
	response := struct {
		//結構體字面量
		Success bool     `json:"success"`
		Item    TodoItem `json:"item"`
	}{
		//結構體字面量的初始化器
		Success: true,
		Item:    item, // 返回新增的資料
	}
	json.NewEncoder(w).Encode(response) //將結構體編碼成 JSON 格式，並將其寫入到 HTTP 回應中

}
