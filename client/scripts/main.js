// YOUR CODE HERE
// var rows = $('.sortable tbody tr');

$('.search').keyup(function () {
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

  const nestedData = d3.nest()
          .key(d => d.fund)
          .entries(data);

  const fundData = extractFundData(nestedData);
  const fundColumns = Object.keys(fundData[0]);
  const subTables = formatSubTables(nestedData);

  const fundTable = createTable(fundColumns, fundData);
  const tableWrapper = document.querySelector('.table-container');
  tableWrapper.appendChild(fundTable); // do we want to append like this, or use d3 (can we use d3 for the subTables?)

  // FORMAT DATA

  function extractFundData(data) {
    return data.map(fund => {
      return {
        'Fund': fund.key,
        'Weight in portfolio': fund.values[0]['weight in portfolio'],
        'Portfolio value': fund.values[0]['portfolio value']
      };
    });

  }

  function formatSubTables(data) {
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

  // CREATE A TABLE FROM DATA

  function createTable(columns, rows) {
    var table = d3.select(document.createElement('table'));
    var thead = table.append('thead');
    var tbody = table.append('tbody');

    thead.append('tr')
      .selectAll('th')
      .data(columns)
      .enter()
      .append('th')
      .attr('class', 'sortable sort-up')
      .text(column => column);

    var rows = tbody.selectAll('tr')
          .data(rows)
          .enter()
          .append('tr')
          .attr('data-fund', d => d.fund); // this is specific

    var cells = rows.selectAll('td')
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

    table[0][0].classList.add('sortable', 'o-table', 'o-table--compact');
    return table[0][0]; // because the actual element is inside a d3 structure
  }

  // DISPLAY DATA ON USER EVENTS

  const rowElements = Array.from(document.querySelectorAll('tbody tr')); // use dom-delegate instead
  rowElements.forEach(row => {
    row.addEventListener('click', rowClickHandler);
  });

  function rowClickHandler(e) {
    e.stopImmediatePropagation();
    const row = e.target.parentElement; // because it's going to be a <td>
    if (row.classList.contains('opened')) {
      closeSlideout(row);
    } else {
      const clickedFund = row.dataset.fund;
      const subData = subTables.filter(fund => fund.Fund === clickedFund);
      const subColumns = Object.keys(subData[0].bonds[0]);
      const subTable = createTable(subColumns, subData[0].bonds);
      openSlideout(row, subTable);
    }
  }

  function openSlideout(row, subTable) {
    row.classList.add('opened');

    const newRow = row.parentElement.insertRow(row.rowIndex);
    const fullCell = newRow.insertCell();
    fullCell.colSpan = 9;
    const slider = document.createElement('div');
    slider.classList.add('sliding');
    fullCell.appendChild(slider);
    window.getComputedStyle(slider).height;
    //slider.style.height = '100px';
    slider.appendChild(subTable); // again, not using d3 to append
    slider.style.height = subTable.clientHeight;
  }

  function closeSlideout(row) {
    row.classList.remove('opened');

    const slider = document.querySelector('.sliding');

    slider.addEventListener('transitionend', (e) => {
      e.stopImmediatePropagation();
      slider.style.display = 'none';
      row.parentElement.deleteRow(row.rowIndex);
    }, false); // do we need stopImmediateProp... and useCapture: false?

    // start the transition
    slider.style.height = '0px';
    row.parentElement.deleteRow(row.rowIndex);

  }

  function closeAllSubTables() {
    // TODO: when something clicked, close all open drawer elements
  };

  new Tablesort(document.querySelector('.sortable'));
})
