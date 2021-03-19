var chosenTab = '1';
var chosenMember = '1';

function switchTab(id) {
  document.getElementById('tab' + chosenTab).style.color = 'white';
  document.getElementById('tab' + chosenTab).style.backgroundColor = 'var(--main-header-color)';
  document.getElementById('info' + chosenTab).style.display = 'none';

  chosenTab = id;

  if(chosenTab != '2')
    document.getElementById('demovid').pause();
  else {
    document.getElementById('demovid').currentTime = 0;
    document.getElementById('demovid').play();
  }

  document.getElementById('tab' + chosenTab).style.color = 'var(--main-header-color)';
  document.getElementById('tab' + chosenTab).style.backgroundColor = 'white';
  document.getElementById('info' + chosenTab).style.display = 'block';

}

function display1() {
  switchTab('1');
}

function display2() {
  switchTab('2');
}

function display3() {
  switchTab('3');
}

function display4() {
  switchTab('4');
}



function member(id) {
  document.getElementById('memberTab' + chosenMember).style.color = 'white';
  document.getElementById('memberTab' + chosenMember).style.backgroundColor = 'var(--main-header-color)';
  document.getElementById('memberInfo' + chosenMember).style.display = 'none';

  chosenMember = id;

  document.getElementById('memberTab' + chosenMember).style.color = 'var(--main-header-color)';
  document.getElementById('memberTab' + chosenMember).style.backgroundColor = 'white';
  document.getElementById('memberInfo' + chosenMember).style.display = 'flex';

}

function displayMember1() {
  member('1');
}

function displayMember2() {
  member('2');
}

function displayMember3() {
  member('3');
}

function displayMember4() {
  member('4');
}

function displayMember5() {
  member('5');
}
