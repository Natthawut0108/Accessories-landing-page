/* =========================================
   AXIS — script.js
   Shared JavaScript for product.html, order.html, admin.html
   ========================================= */

// ---- CONFIG: แก้ค่า 2 ตัวนี้ให้ตรงกับของจริงก่อนใช้งาน ----
const APPS_SCRIPT_URL = 'APPS_SCRIPT_URL_HERE'; // URL ของ Google Apps Script Web App
const CSV_URL = 'CSV_URL_HERE'; // URL ของ Google Sheet ที่ publish เป็น CSV

const PRODUCTS_JSON_PATH = 'products.json';

// Label ที่ใช้แสดงบนปุ่มกรอง เรียงตามลำดับที่ต้องการ
const TYPE_LABELS = {
  necklace: 'Necklace',
  bracelet: 'Bracelet',
  ring: 'Ring',
  earrings: 'Earrings',
  bangle: 'Bangle',
  watch: 'Watch',
  sunglasses: 'Sunglasses',
  wallet: 'Wallet',
  bag: 'Bag',
  socks: 'Socks'
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('product-list')) {
    initProductPage();
  }
  if (document.getElementById('orderForm')) {
    initOrderPage();
  }
  if (document.querySelector('#ordersTable tbody')) {
    initAdminPage();
  }
});

/* =========================================
   1) product.html — รายการสินค้า + ตัวกรอง
   ========================================= */
function initProductPage() {
  const filterBar = document.getElementById('filter-bar');
  const productList = document.getElementById('product-list');

  fetch(PRODUCTS_JSON_PATH)
    .then((res) => {
      if (!res.ok) throw new Error('โหลดข้อมูลสินค้าไม่สำเร็จ');
      return res.json();
    })
    .then((products) => {
      const urlParams = new URLSearchParams(window.location.search);
      const initialType = urlParams.get('type') || 'all';

      renderFilterBar(filterBar, products, initialType, (selectedType) => {
        renderProductList(productList, products, selectedType);
      });

      renderProductList(productList, products, initialType);
    })
    .catch((error) => {
      console.error(error);
      productList.innerHTML = '<p>ไม่สามารถโหลดสินค้าได้ในขณะนี้</p>';
    });
}

function renderFilterBar(filterBar, products, activeType, onSelect) {
  if (!filterBar) return;

  const typesPresent = [...new Set(products.map((p) => p.type))];

  const buttons = [{ type: 'all', label: 'ทั้งหมด' }].concat(
    typesPresent.map((type) => ({
      type,
      label: TYPE_LABELS[type] || type
    }))
  );

  filterBar.innerHTML = '';

  buttons.forEach(({ type, label }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn' + (type === activeType ? ' btn-accent' : '');
    btn.dataset.type = type;
    btn.textContent = label;

    btn.addEventListener('click', () => {
      filterBar.querySelectorAll('button').forEach((b) => b.classList.remove('btn-accent'));
      btn.classList.add('btn-accent');
      onSelect(type);
    });

    filterBar.appendChild(btn);
  });
}

function renderProductList(productList, products, type) {
  if (!productList) return;

  const filtered = type && type !== 'all'
    ? products.filter((p) => p.type === type)
    : products;

  productList.innerHTML = '';

  if (filtered.length === 0) {
    productList.innerHTML = '<p>ไม่พบสินค้าในหมวดนี้</p>';
    return;
  }

  filtered.forEach((product) => {
    productList.appendChild(createProductCard(product));
  });
}

function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';

  const img = document.createElement('img');
  img.className = 'product-image';
  img.src = product.image;
  img.alt = product.name;

  const info = document.createElement('div');
  info.className = 'product-info';

  const typeLine = document.createElement('span');
  typeLine.className = 'product-type-label';
  const dot = document.createElement('span');
  dot.className = 'product-type-dot';
  dot.dataset.type = product.type;
  typeLine.appendChild(dot);
  typeLine.appendChild(document.createTextNode(TYPE_LABELS[product.type] || product.type));

  const name = document.createElement('h3');
  name.className = 'product-name';
  name.textContent = product.name;

  const desc = document.createElement('p');
  desc.className = 'product-desc';
  desc.textContent = product.description || '';

  const price = document.createElement('p');
  price.className = 'product-price';
  price.textContent = formatPrice(product.price);

  const orderLink = document.createElement('a');
  orderLink.className = 'btn btn-accent btn-block';
  orderLink.style.marginTop = 'var(--space-sm)';
  orderLink.textContent = 'สั่งซื้อ';
  orderLink.href = `order.html?item=${encodeURIComponent(product.name)}&price=${encodeURIComponent(product.price)}`;

  info.appendChild(typeLine);
  info.appendChild(name);
  info.appendChild(desc);
  info.appendChild(price);
  info.appendChild(orderLink);

  card.appendChild(img);
  card.appendChild(info);

  return card;
}

function formatPrice(price) {
  const num = Number(price);
  if (Number.isNaN(num)) return price;
  return num.toLocaleString('th-TH') + ' บาท';
}

/* =========================================
   2) order.html — ฟอร์มสั่งซื้อ
   ========================================= */
function initOrderPage() {
  const form = document.getElementById('orderForm');
  const itemsField = document.getElementById('items');
  const totalField = document.getElementById('total');

  const urlParams = new URLSearchParams(window.location.search);
  const item = urlParams.get('item');
  const price = urlParams.get('price');

  if (item && itemsField) {
    itemsField.value = item;
  }
  if (price && totalField) {
    totalField.value = price;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const payload = {
      customerName: document.getElementById('customerName').value,
      contact: document.getElementById('contact').value,
      items: document.getElementById('items').value,
      total: document.getElementById('total').value,
      note: document.getElementById('note').value
    };

    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
      .then(() => {
        window.location.href = 'thankyou.html';
      })
      .catch((error) => {
        console.error(error);
        alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      });
  });
}

/* =========================================
   3) admin.html — ตารางออเดอร์จาก Google Sheet (CSV)
   ========================================= */
function initAdminPage() {
  const tbody = document.querySelector('#ordersTable tbody');

  fetch(CSV_URL)
    .then((res) => {
      if (!res.ok) throw new Error('โหลดข้อมูลออเดอร์ไม่สำเร็จ');
      return res.text();
    })
    .then((csvText) => {
      const rows = parseCSV(csvText);
      renderOrdersTable(tbody, rows);
    })
    .catch((error) => {
      console.error(error);
      tbody.innerHTML = '<tr><td colspan="6">ไม่สามารถโหลดข้อมูลออเดอร์ได้ในขณะนี้</td></tr>';
    });
}

// CSV parser แบบง่าย รองรับ field ที่ครอบด้วย " และมี comma/newline อยู่ข้างใน
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    const nextChar = normalized[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(field);
        field = '';
      } else if (char === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += char;
      }
    }
  }

  // field/row สุดท้ายถ้ายังไม่ถูก push (กรณีไฟล์ไม่ลงท้ายด้วย newline)
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // ตัดแถวว่างล้วนทิ้ง
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

function renderOrdersTable(tbody, rows) {
  if (rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6">ยังไม่มีออเดอร์</td></tr>';
    return;
  }

  // แถวแรกถือเป็น header ถ้าคอลัมน์แรกไม่ใช่วันที่/เวลาที่ parse ได้
  let dataRows = rows;
  const firstCell = rows[0][0] || '';
  if (isNaN(Date.parse(firstCell))) {
    dataRows = rows.slice(1);
  }

  // เรียงจากล่าสุดขึ้นก่อน โดยอิงคอลัมน์แรก (วันเวลา)
  dataRows.sort((a, b) => {
    const dateA = new Date(a[0]);
    const dateB = new Date(b[0]);
    return dateB - dateA;
  });

  tbody.innerHTML = '';

  dataRows.forEach((cols) => {
    const tr = document.createElement('tr');

    // คาดว่าคอลัมน์เรียงเป็น: วันเวลา, ชื่อลูกค้า, เบอร์โทร/Line, รายการสินค้า, จำนวนเงินรวม, หมายเหตุ
    for (let i = 0; i < 6; i++) {
      const td = document.createElement('td');
      td.textContent = cols[i] !== undefined ? cols[i] : '';
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  });
}
