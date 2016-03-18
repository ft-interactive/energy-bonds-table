// Pre-existing search function
$('.search').keyup(function () {
  // close any open child tables when a search begins
  closeAllChildTables();
  var _this = this;
  // Show only matching TR, hide rest of them
  $.each($('.sortable tbody tr'), function () {
    if ($(this).text().toLowerCase().indexOf($(_this).val().toLowerCase()) === -1)
      $(this).hide();
    else
      $(this).show();
  });
});

d3.csv('./sample.csv', data => {
  // format the data
  const nestedByFund 	= d3.nest()
          .key(d => d.fund)
          .entries(data);
  const fundData 		= extractFundData(nestedByFund);
  const fundColumns 	= Object.keys(fundData[0]);
  const childTableData 	= formatChildTableData(nestedByFund);

  // create the parent table and make it sortable
  const fundTable 		= createFundTable(fundColumns, fundData);
  new Tablesort(fundTable);

  // append it to a target element on the page
  const tableWrapper 	= document.querySelector('.table-container');
  tableWrapper.appendChild(fundTable);

  // once there is a table in the dom, listen for events
  const rowElements = Array.from(document.querySelectorAll('tbody tr'));
  rowElements.forEach(row => {
    row.addEventListener('click', rowClickHandler); // would be better to use dom-delegate instead of hundreds of event listeners
  });

  function rowClickHandler(e) {
    e.stopPropagation();
    const row = e.target.parentElement; // parent, because the click will be on the cell rather than the row
    if (row.classList.contains('opened')) { // use this dynamic class to switch childtables between opened and closed states
      closeChildTable(row); // there are two functions that close the childTables - only real difference is a transition is applied when child table is closed 'directly' - ie by a click on the parent row.
    } else {
      // close any open child tables before opening a new one
      closeAllChildTables();

      // generate the correct childTable when required
      var clickedFund 	= row.dataset.fund;
      var subData 		= childTableData.filter(row => row.fund === clickedFund);
      var subColumns 	= Object.keys(subData[0].bonds[0]);
      var childTable 	= createChildTable(subColumns, subData[0].bonds);

      openChildTable(row, childTable);
    }
  }

  // close child table when the user sorts the parent table
  document.querySelector('thead').addEventListener('click', (e) => {
    e.stopPropagation();
    closeAllChildTables();
  });
});

// data formatting functions
function extractFundData(data) {
  return data.map(fund => {
    return {
      'Fund': fund.key,
      'Weight in portfolio': fund.values[0]['weight in portfolio'],
      'Portfolio value': fund.values[0]['portfolio value']
    };
  });
}

function formatChildTableData(data) {
  return data.map(fund => {
    return {
      fund: fund.key,
      bonds: fund.values.map(value => {
        return {
          'Bond': value.bond,
          'Country': value.country,
          'Issuer': value.issuer,
          'Maturity': value.maturity,
          'Rating': value.rating
        };
      })
    };
  });
}

// table generators
function createFundTable(columns, rows) {
  var table = d3.select(document.createElement('table')); // d3 is currently being added to the page by a script tag in the markup
  var thead = table.append('thead');
  var tbody = table.append('tbody');

  thead.append('tr')
    .selectAll('th')
    .data(columns)
    .enter()
    .append('th')
    .attr('class', d => d === 'Fund' ? 'sort-up' : null) // the table will be sorted by fund name initially
    .text(column => column);

  var tableRows = tbody.selectAll('tr')
        .data(rows)
        .enter()
        .append('tr')
        .attr('data-fund', d => d.Fund); // to be able to identify which fund a user has selected from click events

  var cells = tableRows.selectAll('td')
        .data(row => {
          return columns.map(column => {
            return {
              column: column,
              value: row[column]
            };
          });
        })
        .enter()
        .append('td')
        .text(d => d.value)
        .attr('class', d => {
          if (d.column === 'Weight in portfolio' || d.column === 'Portfolio value') { // right-align numerical values
            return 'clickable right-aligned-cell';
          } else {
            return 'clickable';
          }
        });

  table[0][0].classList.add('sortable', 'o-table', 'o-table--compact');
  return table[0][0]; // digging down because the actual table element is inside a d3 structure
}

function createChildTable(columns, rows) {
  var table = d3.select(document.createElement('table'));
  var thead = table.append('thead');
  var tbody = table.append('tbody');

  thead.append('tr')
    .selectAll('th')
    .data(columns)
    .enter()
    .append('th')
    .text(column => column)
    .attr('class', 'notclickable');

  var tableRows = tbody.selectAll('tr')
        .data(rows)
        .enter()
        .append('tr');

  var cells = tableRows.selectAll('td')
        .data(row => {
          return columns.map(column => {
            return {
              column: column,
              value: row[column]
            };
          });
        })
        .enter()
        .append('td')
        .text(d => d.value);

  table[0][0].classList.add('o-table', 'o-table--compact');
  return table[0][0];
}


// functions to add / remove child tables to / from the dom with appropriate transitions
function openChildTable(row, childTable) {
  row.classList.add('opened');

  // to allow the child table to span the width of the parent table, contain the child table within a single full-width table cell of a new row in the parent table
  const containingRow = row.parentElement.insertRow(row.rowIndex);
  const containingCell = containingRow.insertCell();
  containingRow.classList.add('subtable');
  containingCell.colSpan = 9;
  containingCell.style.paddingLeft = '10%';

  // in order to allow css transitions on height, wrap the table in a non-table element
  const containingDiv = document.createElement('div');
  containingDiv.classList.add('child-table-container');

  // wrap up the child table, then transition the height of the containing div
  containingDiv.appendChild(childTable);
  containingCell.appendChild(containingDiv);
  window.getComputedStyle(containingDiv).height;
  containingDiv.style.height = `${childTable.clientHeight}px`;
}

function closeChildTable(row) {
  row.classList.remove('opened');

  // delete the row once the closing transition is finished
  const childTableContainer = document.querySelector('.child-table-container');
  childTableContainer.addEventListener('transitionend', () => {
    row.parentElement.deleteRow(row.rowIndex);
  });

  // start the transition
  childTableContainer.style.height = '0px';
}

function closeAllChildTables() {
  const openedRows = Array.from(document.querySelectorAll('.opened'));
  openedRows.forEach(row => row.classList.remove('opened'));

  const childTables = Array.from(document.querySelectorAll('.subtable'));
  childTables.forEach(childTable => {
    const tbody = document.querySelector('tbody');
    tbody.removeChild(childTable);
  });
}
