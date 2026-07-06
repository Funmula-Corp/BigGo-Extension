function save_options(method) {
  var regions = document.querySelectorAll('.radio');
  var port = chrome.runtime.connect({name: "optionsExtension"});
  var selectRegion
  for (let i = 0; i < regions.length; i++) {
    if(regions[i].checked){
      selectRegion = regions[i].value
      break;
    }
  }

  chrome.storage.local.set({permission: selectRegion})
}

window.addEventListener("load", ()=>{
  document.getElementById('save').addEventListener('click',()=>{save_options('save')});
  var NowRegionOption = localStorage.regionOption
  var NowRegion = localStorage.region
  if(NowRegionOption)document.getElementById(NowRegionOption).checked = true

  const trans = translationRegion[NowRegion] || translationRegion["en"]
  Translation = trans.trans

  document.getElementById('save').value = Translation['save']
  document.getElementById('reset').value = Translation['reset']

  document.getElementById('reset').addEventListener('click',()=>{
    document.getElementById('auto').checked = true
    document.getElementById('tw').checked = false
    document.getElementById('th').checked = false
    save_options('reset')
  });
});
