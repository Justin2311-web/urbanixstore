# Urbanix Store User Information Sheet

User Information sheet ID:

```text
17W6cG6gZKaJhMaJuJinshXS3aOq5Ka5Wcwakuu_zNIg
```

Tab:

```text
Users
```

Columns:

```csv
user_id,created_at,updated_at,customer_name,customer_phone,customer_email,customer_address,last_order_product,last_order_date,notes
```

The storefront saves customer information to localStorage immediately. To also sync rows into Google Sheet, deploy a Google Apps Script web app for the sheet and set this Vercel environment variable:

```env
GOOGLE_USER_INFO_WEBHOOK_URL=
```

Apps Script webhook:

```javascript
const SHEET_NAME = "Users";

function doPost(e) {
  const payload = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rows = sheet.getDataRange().getValues();
  const phoneIndex = headers.indexOf("customer_phone");
  const now = new Date().toISOString();
  const phone = String(payload.customerPhone || "").replace(/\D/g, "");
  let rowNumber = -1;

  for (let index = 1; index < rows.length; index += 1) {
    if (String(rows[index][phoneIndex] || "").replace(/\D/g, "") === phone) {
      rowNumber = index + 1;
      break;
    }
  }

  const existingCreatedAt = rowNumber > 0 ? sheet.getRange(rowNumber, headers.indexOf("created_at") + 1).getValue() : "";
  const values = headers.map((header) => {
    switch (header) {
      case "user_id": return payload.userId || Utilities.getUuid();
      case "created_at": return existingCreatedAt || payload.createdAt || now;
      case "updated_at": return now;
      case "customer_name": return payload.customerName || "";
      case "customer_phone": return phone;
      case "customer_email": return payload.customerEmail || "";
      case "customer_address": return payload.customerAddress || "";
      case "last_order_product": return payload.lastOrderProduct || "";
      case "last_order_date": return payload.lastOrderDate || "";
      case "notes": return payload.notes || "";
      default: return "";
    }
  });

  if (rowNumber > 0) {
    sheet.getRange(rowNumber, 1, 1, values.length).setValues([values]);
  } else {
    sheet.appendRow(values);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, rowNumber }))
    .setMimeType(ContentService.MimeType.JSON);
}
```
