"use strict";

const rowsPerPageBtns = document.querySelectorAll(".perPageBtn");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const currentPageDisplay = document.getElementById("currentPage");
const pageNumberInput = document.getElementById("pageNumberInput");
const goToPageBtn = document.getElementById("goToPageBtn");
let currentPage = 1;
let rowsPerPage = 10;
const resetBtn = document.querySelector(".col-tableHeader .resetBtn");

const selectAllCheckbox = document.querySelector(
  'th.checkbox input[name="selectAll"]'
);

let dataFromBackEnd;
const codeMap = {
  "0000": "Mental health check-up",
  "0001": "Physical health check-up",
  "0002": "Computer workstation certificate",
  "0003": "Driver's license renewal time",
  "0004": "Driver's health check-up"
};
getData().then(() => {
  for (let i = 0; i < dataFromBackEnd.length; i++) {
    createRow(dataFromBackEnd, i);
  }
  updateTable(dataFromBackEnd);
});

async function getData() {
  const response = await fetch(`dummy.json`);
  dataFromBackEnd = await response.json();
}
// ----------------------------------------------------------------------

goToPageBtn.addEventListener("click", () => {
  goToPage();
});

pageNumberInput.addEventListener("click", function () {
  this.value = "";
});

pageNumberInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    goToPage();
  }
});

function goToPage() {
  const inputPageNumber = parseInt(pageNumberInput.value);
  const totalPages = Math.ceil(dataFromBackEnd.length / rowsPerPage);
  if (inputPageNumber >= 1 && inputPageNumber <= totalPages) {
    currentPage = inputPageNumber;
    updateTable(dataFromBackEnd);
  } else {
    alert("Please enter a valid page number.");
  }
}

// ----------------------------------------------------------------------

rowsPerPageBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    rowsPerPage = parseInt(btn.textContent);
    updateTable(dataFromBackEnd);
    highlightSelectedRowsPerPage(btn);
  });
});

prevPageBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    updateTable(dataFromBackEnd);
  }
});

nextPageBtn.addEventListener("click", () => {
  const totalPages = Math.ceil(dataFromBackEnd.length / rowsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    updateTable(dataFromBackEnd);
  }
});

function updateTable(dataFromBackEnd) {
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const dataToShow = dataFromBackEnd.slice(startIndex, endIndex);

  document.getElementById("tableData").innerHTML = "";

  for (let i = 0; i < dataToShow.length; i++) {
    createRow(dataToShow, i);
  }

  selectAllCheckbox.checked = false;

  const totalPages = Math.ceil(dataFromBackEnd.length / rowsPerPage);
  currentPageDisplay.textContent = `Page ${currentPage}/${totalPages}`;
}

function highlightSelectedRowsPerPage(selectedBtn) {
  rowsPerPageBtns.forEach((btn) => {
    btn.classList.remove("selected");
  });
  selectedBtn.classList.add("selected");
}

// ----------------------------------------------------------------------

function createRow(data, row) {
  let fullName = data[row].name + " " + data[row].lastName;
  let department = data[row].department;
  let userStatus = data[row].userStatus;
  let jobTitle = data[row].jobTitle;
  let id = row;
  let healthCheckCountAll = data[row].healthCheck.code.length;
  let healthCheckCountValid = 0;

  data[row].healthCheck.expiration.forEach((expiration, index) => {
    if (
      data[row].healthCheck.status[index] !== "Canceled" &&
      !isExpired(expiration)
    ) {
      healthCheckCountValid++;
    }
  });

  const rowElement = document.createElement("tr");
  rowElement.classList.add("clickable-row");

  rowElement.addEventListener("click", function () {
    toggleInnerRow(fullName, rowElement, id);
  });

  rowElement.innerHTML = `
  <td class="row checkbox"><input type="checkbox" name="selectOne"></td>
  <td class="row">
  <span class="arrowUp">\u25B4 </span> 
  <span class="arrowDown">\u25BE</span>
  ${fullName}
  <span>(${healthCheckCountValid}/${healthCheckCountAll})</span>
     </td>
  <td class="row"></td>
  <td class="row"></td>
  <td class="row"></td>
  <td class="row">${department}</td>
  <td class="row" id="userStatus">
  <span class="${
    userStatus === "Active" ? "greenBox" : "redBox"
  }">${userStatus}</span> </td>
  <td class="row">${jobTitle}</td>
  <td class="row editing"><button class="editBtn" title="Edit">...</button></td>
`;

  document.getElementById("tableData").appendChild(rowElement);

  const editButton = rowElement.querySelector(".editBtn");
  editButton.addEventListener("click", function (event) {
    editRow(data, row);
  });
}

//----------------------------------------------------------------
function editInnerRow(healthCheck, row) {
  const code = healthCheck.code[row];
  const expiration = healthCheck.expiration[row];
  const status = getStatus(healthCheck.status[row], expiration);

  const modalContainer = document.createElement("div");
  modalContainer.classList.add("modal-container");

  const modalContent = document.createElement("div");
  modalContent.classList.add("modal-content");

  const codeSpan = document.createElement("span");
  codeSpan.textContent = code;

  // const codeSelect = document.createElement("select");
  // codeSelect.setAttribute("title", "Code");

  // for (const codeKey in codeMap) {
  //   const option = document.createElement("option");
  //   option.value = codeKey;
  //   option.textContent = codeMap[codeKey];
  //   if (codeKey === code) {
  //     option.selected = true;
  //   }
  //   codeSelect.appendChild(option);
  // }

  const relevantInfo = document.createElement("span");
  relevantInfo.textContent = codeMap[code];

  // codeSelect.addEventListener("change", function () {
  //   relevantInfo.textContent = codeSelect.value;
  // });

  const dateInput = document.createElement("input");
  dateInput.setAttribute("type", "text");
  dateInput.setAttribute("title", "Expiration Date");
  dateInput.value = expiration;

  const statusInput = document.createElement("span");
  statusInput.textContent = status;

  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";

  deleteButton.addEventListener("click", function () {
    healthCheck.code.splice(row, 1);
    healthCheck.expiration.splice(row, 1);
    healthCheck.status.splice(row, 1);

    updateTable(dataFromBackEnd);
    modalContainer.remove();
  });

  const saveButton = document.createElement("button");
  saveButton.textContent = "Save";

  saveButton.addEventListener("click", function () {
    healthCheck.expiration[row] = dateInput.value;
    if (cancelledCheckbox.checked) {
      healthCheck.status[row] = "Canceled";
    } else {
      healthCheck.status[row] = "Valied";
    }

    updateTable(dataFromBackEnd);

    modalContainer.remove();
  });

  const closeButton = document.createElement("button");
  closeButton.textContent = "Close";
  closeButton.addEventListener("click", function () {
    modalContainer.remove();
  });

  const cancelledCheckbox = document.createElement("input");
  cancelledCheckbox.setAttribute("type", "checkbox");
  cancelledCheckbox.id = "cancelled-checkbox";
  if (status === "Canceled") {
    cancelledCheckbox.checked = true;
  }
  const cancelledLabel = document.createElement("label");
  cancelledLabel.textContent = "Cancelled";
  cancelledLabel.setAttribute("for", "cancelled-checkbox");

  [
    // codeSelect,
    codeSpan,
    relevantInfo,
    dateInput,
    statusInput,
    deleteButton,
    saveButton,
    cancelledCheckbox,
    cancelledLabel
  ].forEach((element) => {
    element.style.display = "inline-block";
    element.style.marginRight = "10px";
  });

  // modalContent.appendChild(codeSelect);
  modalContent.appendChild(codeSpan);
  modalContent.appendChild(relevantInfo);
  modalContent.appendChild(dateInput);
  modalContent.appendChild(statusInput);
  modalContent.appendChild(deleteButton);
  modalContent.appendChild(saveButton);
  modalContent.appendChild(closeButton);
  modalContainer.appendChild(modalContent);

  modalContent.appendChild(cancelledCheckbox);
  modalContent.appendChild(cancelledLabel);

  document.body.appendChild(modalContainer);
}

function getStatus(status, expiration) {
  if (status) {
    if (status === "Canceled") {
      return "Canceled";
    } else {
      return isExpired(expiration) ? "Expired" : "Valid";
    }
  } else {
    return "No data";
  }
}

//----------------------------------------------------------------
function editRow(data, row) {
  const userData = data[row];

  const modalContainer = document.createElement("div");
  modalContainer.classList.add("modal-container");

  const modalContent = document.createElement("div");
  modalContent.classList.add("modal-content");

  const nameInput = document.createElement("input");
  nameInput.setAttribute("type", "text");
  nameInput.setAttribute("title", "Name");
  nameInput.value = userData.name;

  const lastNameInput = document.createElement("input");
  lastNameInput.setAttribute("type", "text");
  lastNameInput.setAttribute("title", "Last Name");
  lastNameInput.value = userData.lastName;

  const departmentInput = document.createElement("input");
  departmentInput.setAttribute("type", "text");
  departmentInput.setAttribute("title", "Department");
  departmentInput.value = userData.department;

  const userStatusInput = document.createElement("select");
  userStatusInput.setAttribute("title", "User Status");
  userStatusInput.innerHTML = `
  <option value="Active" ${
    userData.userStatus === "Active" ? "selected" : ""
  }>Active</option>
  <option value="Inactive" ${
    userData.userStatus === "Inactive" ? "selected" : ""
  }>Inactive</option>
`;

  const jobTitleInput = document.createElement("input");
  jobTitleInput.setAttribute("type", "text");
  jobTitleInput.setAttribute("title", "Job Title");
  jobTitleInput.value = userData.jobTitle;

  const saveButton = document.createElement("button");
  saveButton.textContent = "Save";
  saveButton.addEventListener("click", function () {
    userData.name = nameInput.value;
    userData.lastName = lastNameInput.value;
    userData.department = departmentInput.value;
    userData.userStatus = userStatusInput.value;
    userData.jobTitle = jobTitleInput.value;
    updateTable(dataFromBackEnd);
    modalContainer.remove();
  });

  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";

  deleteButton.addEventListener("click", function () {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const dataIndex = startIndex + row;
    dataFromBackEnd.splice(dataIndex, 1);
    modalContainer.remove();
    updateTable(dataFromBackEnd);
  });

  const closeButton = document.createElement("button");
  closeButton.textContent = "Close";
  closeButton.addEventListener("click", function () {
    modalContainer.remove();
  });

  modalContent.appendChild(nameInput);
  modalContent.appendChild(lastNameInput);
  modalContent.appendChild(departmentInput);
  modalContent.appendChild(userStatusInput);
  modalContent.appendChild(jobTitleInput);
  modalContent.appendChild(saveButton);
  modalContent.appendChild(deleteButton);
  modalContent.appendChild(closeButton);

  modalContainer.appendChild(modalContent);

  document.body.appendChild(modalContainer);
}

//----------------------------------------------------------------
function createInnerRow(fullName, rowElement, id) {
  let healthCheck = getCorrectHealthCheckByFullName(fullName);
  let row = healthCheck.code.length;
  if (row === 0) {
    const innerRow = document.createElement("tr");
    innerRow.classList.add("inner-row", `${id}`);
    innerRow.innerHTML = `
    <td class="row checkbox"><input type="checkbox" name="selectOne"></td>
      <td colspan="9" class="row no-data">No data</td>
    `;
    rowElement.parentNode.insertBefore(innerRow, rowElement.nextSibling);
  } else {
    for (let i = 0; i < row; i++) {
      const innerRow = document.createElement("tr");
      innerRow.classList.add("inner-row", `${id}`);

      let status = healthCheck.status[i];

      if (healthCheck.status[i] === "Canceled") {
        status = "Canceled";
      } else {
        if (isExpired(healthCheck.expiration[i])) {
          status = "Expired";
        } else {
          status = "Valid";
        }
      }

      innerRow.innerHTML = `
  <td class="row checkbox"><input type="checkbox" name="selectOne"></td>
  <td class="row">${codeMap[healthCheck.code[i]] || "Unknown"}</td>
  <td class="row">${healthCheck.code[i]}</td>
  <td class="row">${healthCheck.expiration[i]}</td>
  <td class="row">
  <span class="${
    status === "Canceled"
      ? "greyBox"
      : status === "Expired"
      ? "redBox"
      : "greenBox"
  }"</span>
  ${status}</td>

  <td class="row"></td>
  <td class="row" id="userStatus"></td>
  <td class="row"></td>
  <td class="row editing"><button class="editBtn">...</button></td>
`;

      const editButton = innerRow.querySelector(".editBtn");

      editButton.addEventListener("click", function (event) {
        editInnerRow(healthCheck, i);
      });

      rowElement.parentNode.insertBefore(innerRow, rowElement.nextSibling);
    }
  }
}

function getCorrectHealthCheckByFullName(fullName) {
  const fullNameParts = fullName.trim().split(/\s+/);
  let name = fullNameParts[0];
  let lastName =
    fullNameParts.length > 1 ? fullNameParts[fullNameParts.length - 1] : "";

  for (let i = 0; i < dataFromBackEnd.length; i++) {
    if (
      dataFromBackEnd[i].name === name &&
      dataFromBackEnd[i].lastName === lastName
    ) {
      return dataFromBackEnd[i].healthCheck;
    }
  }
}

function toggleInnerRow(fullName, rowElement, id) {
  if (
    event.target.tagName === "INPUT" &&
    event.target.getAttribute("type") === "checkbox"
  ) {
    return;
  } else if (event.target.tagName === "BUTTON") {
    return;
  }

  rowElement.classList.toggle("greenBackground");
  arrow(rowElement);

  const innerRows = Array.from(rowElement.parentNode.children).filter(
    (child) =>
      child.classList.contains("inner-row") && child.classList.contains(id)
  );

  if (innerRows.length > 0) {
    const isVisible = innerRows.some(
      (innerRow) => innerRow.style.display !== "none"
    );

    innerRows.forEach((innerRow) => {
      innerRow.style.display = isVisible ? "none" : "table-row";
    });
  } else {
    createInnerRow(fullName, rowElement, id);
  }
}

function isExpired(expirationDateStr) {
  let expirationDate = new Date(expirationDateStr);
  let currentDate = new Date();

  let expirationTime = expirationDate.getTime();
  let currentTime = currentDate.getTime();

  return expirationTime < currentTime;
}

resetBtn.addEventListener("click", () => {
  const selectedRows = document.querySelectorAll(".clickable-row");
  const openInnerRows = document.querySelectorAll(".inner-row");

  const checkboxes = document.querySelectorAll(
    'td.checkbox input[type="checkbox"]'
  );
  checkboxes.forEach((checkbox) => {
    checkbox.checked = false;
  });

  openInnerRows.forEach((innerRow) => {
    innerRow.style.display = "none";
  });

  selectedRows.forEach((selectedRow) => {
    selectedRow.classList.remove("greenBackground");
    arrow(selectedRow);
  });

  selectAllCheckbox.checked = false;
});

selectAllCheckbox.addEventListener("change", function () {
  const checkboxes = document.querySelectorAll(
    'td.checkbox input[type="checkbox"]'
  );

  checkboxes.forEach((checkbox) => {
    checkbox.checked = selectAllCheckbox.checked;
  });
});

function arrow(rowElement) {
  const arrowUp = rowElement.querySelector(".arrowUp");
  const arrowDown = rowElement.querySelector(".arrowDown");

  arrowDown.style.display = rowElement.classList.contains("greenBackground")
    ? "none"
    : "inline";
  arrowUp.style.display = rowElement.classList.contains("greenBackground")
    ? "inline"
    : "none";
}

// const tables = document.getElementsByTagName("table");
// for (let i = 0; i < tables.length; i++) {
//   resizableGrid(tables[i]);
// }

// function resizableGrid(table) {
//   const row = table.getElementsByTagName("tr")[0];
//   const cols = row ? row.children : undefined;
//   if (!cols) return;

//   table.style.overflow = "hidden";

//   const tableHeight = table.offsetHeight;

//   for (let i = 0; i < cols.length; i++) {
//     const div = createDiv(tableHeight);
//     cols[i].appendChild(div);
//     cols[i].style.position = "relative";
//     setListeners(div);
//   }

//   function setListeners(div) {
//     let pageX, curCol, nxtCol, curColWidth, nxtColWidth;

//     div.addEventListener("mousedown", function (e) {
//       curCol = e.target.parentElement;
//       nxtCol = curCol.nextElementSibling;
//       pageX = e.pageX;

//       const padding = paddingDiff(curCol);

//       curColWidth = curCol.offsetWidth - padding;
//       if (nxtCol) nxtColWidth = nxtCol.offsetWidth - padding;
//     });

//     div.addEventListener("mouseover", function (e) {
//       e.target.style.borderRight = "2px solid #0000ff";
//     });

//     div.addEventListener("mouseout", function (e) {
//       e.target.style.borderRight = "";
//     });

//     document.addEventListener("mousemove", function (e) {
//       if (e.pageX >= 0 && e.pageX < window.innerWidth - 10) {
//         if (curCol) {
//           const diffX = e.pageX - pageX;
//           if (nxtCol && diffX > 0)
//             nxtCol.style.width = nxtColWidth - diffX + "px";

//           curCol.style.width = curColWidth + diffX + "px";
//         }
//       }
//     });

//     document.addEventListener("mouseup", function (e) {
//       curCol = undefined;
//       nxtCol = undefined;
//       pageX = undefined;
//       nxtColWidth = undefined;
//       curColWidth = undefined;
//     });
//   }

//   function createDiv(height) {
//     const div = document.createElement("div");
//     div.style.top = 0;
//     div.style.right = 0;
//     div.style.width = "5px";
//     div.style.position = "absolute";
//     div.style.cursor = "col-resize";
//     div.style.userSelect = "none";
//     div.style.height = height + "px";
//     return div;
//   }

//   function paddingDiff(col) {
//     if (getStyleVal(col, "box-sizing") == "border-box") {
//       return 0;
//     }

//     const padLeft = getStyleVal(col, "padding-left");
//     const padRight = getStyleVal(col, "padding-right");
//     return parseInt(padLeft) + parseInt(padRight);
//   }

//   function getStyleVal(elm, css) {
//     return window.getComputedStyle(elm, null).getPropertyValue(css);
//   }
// }
