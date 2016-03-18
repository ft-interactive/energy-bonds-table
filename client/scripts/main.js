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

new Tablesort(document.querySelector('.sortable'));

