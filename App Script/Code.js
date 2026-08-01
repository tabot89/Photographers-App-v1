function doPost(e) {
  var lock = LockService.getScriptLock();
  if (lock.tryLock(15000)) {
    try {
      var postData = JSON.parse(e.postData.contents);
      var action = postData.action;
      var result = { success: false };
      
      if (action === 'test') {
        result = { success: true };
      } 
      else if (action === 'getData') {
        result = { success: true, data: getAllData() };
      } 
      else if (action === 'syncData') {
        if (postData.data) {
          var validation = validateBackendData(postData.data);
          if (!validation.success) {
            result = { success: false, error: validation.error };
          } else {
            saveAllData(postData.data);
            result = { success: true, updatedAt: new Date().toISOString() };
          }
        } else {
          result = { success: false, error: '❌ لا توجد بيانات للمزامنة' };
        }
      } 
      else if (action === 'initializeSheets') {
        initializeDatabaseSheets();
        result = { success: true, sheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl() };
      }
      
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    } finally {
      lock.releaseLock();
    }
  } else {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'السيرفر مشغول بطلب آخر، يرجى المحاولة بعد قليل.' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'API active via POST' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function validateBackendData(data) {
  if (data.tasks && !Array.isArray(data.tasks)) return { success: false, error: '❌ هيكل بيانات الواجبات غير صالح' };
  if (data.photographers && !Array.isArray(data.photographers)) return { success: false, error: '❌ هيكل بيانات المصورين غير صالح' };
  if (data.users && !Array.isArray(data.users)) return { success: false, error: '❌ هيكل بيانات المستخدمين غير صالح' };
  return { success: true };
}

function getAllData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return {
    tasks: getSheetData(ss.getSheetByName("Tasks")),
    photographers: getSheetData(ss.getSheetByName("Photographers")),
    users: getSheetData(ss.getSheetByName("users")),
    roleList: ['مصور', 'مونتير', 'مصور درون'],
    updatedAt: new Date().toISOString()
  };
}

function saveAllData(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (data.tasks) saveSheetData(ss.getSheetByName("Tasks"), data.tasks, ["id", "name", "photographerId", "photographerName", "date", "location", "status"]);
  if (data.photographers) saveSheetData(ss.getSheetByName("Photographers"), data.photographers, ["id", "name", "role", "password", "notes"]);
  if (data.users) saveSheetData(ss.getSheetByName("users"), data.users, ["id", "username", "password", "role"]);
}

function getSheetData(sheet) {
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  var headers = rows[0];
  var data = [];
  for (var i = 1; i < rows.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = rows[i][j];
    }
    data.push(obj);
  }
  return data;
}

function saveSheetData(sheet, dataList, defaultHeaders) {
  if (!sheet) return;
  sheet.clear();
  if (!dataList || dataList.length === 0) {
    if (defaultHeaders && defaultHeaders.length > 0) {
      sheet.appendRow(defaultHeaders);
    }
    return;
  }
  var keys = defaultHeaders || Object.keys(dataList[0]);
  var rows = [keys];
  dataList.forEach(function(item) {
    var row = keys.map(function(k) { return item[k] !== undefined && item[k] !== null ? item[k] : ''; });
    rows.push(row);
  });
  sheet.getRange(1, 1, rows.length, keys.length).setValues(rows);
}

function initializeDatabaseSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var tSheet = ss.getSheetByName("Tasks") || ss.insertSheet("Tasks");
  if (tSheet.getLastRow() === 0) {
    tSheet.appendRow(["id", "name", "photographerId", "photographerName", "date", "location", "status"]);
  }
  
  var pSheet = ss.getSheetByName("Photographers") || ss.insertSheet("Photographers");
  if (pSheet.getLastRow() === 0) {
    pSheet.appendRow(["id", "name", "role", "password", "notes"]);
  }
  
  var uSheet = ss.getSheetByName("users") || ss.insertSheet("users");
  if (uSheet.getLastRow() === 0) {
    uSheet.appendRow(["id", "username", "password", "role"]);
    uSheet.appendRow([1, "admin", "admin123", "admin"]);
  }
}