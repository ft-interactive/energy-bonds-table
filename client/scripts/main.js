// YOUR CODE HERE
// var rows = $('.sortable tbody tr');

$('.search').keyup(function () {
  closeAllSubTables();
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
  const nestedByFund = d3.nest()
          .key(d => d.fund)
          .entries(data);

  const fundData 		= extractFundData(nestedByFund);
  const fundColumns 	= Object.keys(fundData[0]);
  const subTableData 	= formatSubTables(nestedByFund);
  const fundTable 		= createFundTable(fundColumns, fundData);
  const tableWrapper 	= document.querySelector('.table-container');

  tableWrapper.appendChild(fundTable); // do we want to append like this, or use d3 (can we use d3 for the subTables?)

  new Tablesort(document.querySelector('.sortable'));

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

  function createFundTable(columns, rows) {
    var table = d3.select(document.createElement('table'));
    var thead = table.append('thead');
    var tbody = table.append('tbody');

    thead.append('tr')
      .selectAll('th')
      .data(columns)
      .enter()
      .append('th')
      //.attr('class', 'sortable')
      .attr('class', d => d === 'Fund' ? 'sort-up' : null)
      .text(column => column);

    var tableRows = tbody.selectAll('tr')
          .data(rows)
          .enter()
          .append('tr')
          .attr('data-fund', d => d.fund); // this is specific

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
          .attr('class', 'clickable')
          .attr('class', d => {
            console.log(d.value);
            if (d.column === 'Weight in portfolio' || d.column === 'Portfolio value') {
              console.log("MOOP");
              return 'clickable right-aligned-cell';
            }
          });

    table[0][0].classList.add('sortable', 'o-table', 'o-table--compact');
    return table[0][0]; // because the actual element is inside a d3 structure
  }

  function createSubTable(columns, rows) {
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
          .text(d => d.value)

    table[0][0].classList.add('o-table', 'o-table--compact');
    return table[0][0]; // because the actual element is inside a d3 structure
  }

  // DISPLAY DATA ON USER EVENTS

  document.querySelector('thead').addEventListener('click', (e) => {
    e.stopPropagation(); // but then sometimes won't reorder / show correct order?
    closeAllSubTables();
  });

  const rowElements = Array.from(document.querySelectorAll('tbody tr')); // use dom-delegate instead
  rowElements.forEach(row => {
    row.addEventListener('click', rowClickHandler);
  });

  function rowClickHandler(e) {
    e.stopPropagation();

    const row = e.target.parentElement; // because it's going to be a <td>
    if (row.classList.contains('opened')) {
      closeSlideout(row);
    } else {
      closeAllSubTables();
      const clickedFund = row.dataset.fund;
      const subData = subTableData.filter(fund => fund.Fund === clickedFund);
      const subColumns = Object.keys(subData[0].bonds[0]);
      const subTable = createSubTable(subColumns, subData[0].bonds);
      openSlideout(row, subTable);
    }
  }

  function openSlideout(row, subTable) {
    row.classList.add('opened');

    const newRow = row.parentElement.insertRow(row.rowIndex);
    newRow.classList.add('subtable');

    const fullCell = newRow.insertCell();
    fullCell.colSpan = 9;
    fullCell.style.paddingLeft = '100px'; // percentage

    const slider = document.createElement('div');
    slider.classList.add('sliding');


    fullCell.appendChild(slider);
    slider.appendChild(subTable);
    window.getComputedStyle(slider).height;
    console.log('height: ', subTable.offsetHeight);
    slider.style.height = `${subTable.clientHeight}px`;

    subTable.style.visibility = 'visible';


  }

  function closeSlideout(row) {
    row.classList.remove('opened');

    const slider = document.querySelector('.sliding');

    slider.addEventListener('transitionend', (e) => {
      row.parentElement.deleteRow(row.rowIndex);
    });

    // start the transition
    slider.style.height = '0px';

  }

});

function closeAllSubTables() {
  const openedRows = Array.from(document.querySelectorAll('.opened'));
  openedRows.forEach(row => row.classList.remove('opened'));

  const subtables = Array.from(document.querySelectorAll('.subtable'));
  subtables.forEach(subtable => {
    const tbody = document.querySelector('tbody');
    tbody.removeChild(subtable);
  });
}
