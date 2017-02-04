define(function (require, exports, module) {
  var time;
  updateSlider();

  $('#slider .slider-panel').on('click', 'li', function () {   
    clearTimeout(time);
    updateSlider($(this).index());
  });

  function updateSlider(index) {
    index = index || 0;
    if (index == 4) index = 0;
    setItem(index);
    setPanel(index);
    time = setTimeout(function () {
      updateSlider(++index);
    }, 2000);
  }

  function setItem(index) {
    var $dom = $('#slider .slider-container');
    var width = -(100 * index);
    $dom.children().css('transform','translateX(' + width + '%)');
    setActive($dom, index);
  }

  function setPanel(index) {
    var $dom = $('#slider .slider-panel');
    setActive($dom, index);
  }

  function setActive($dom, index) {
    $dom.find('.active').removeClass('active');
    $dom.children().eq(index).addClass('active');
  }
});