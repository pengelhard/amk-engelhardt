(function () {
  var list = [
    { id: "zaun", label: "Bauzaun & Absperrgitter", shops: ["bauzaune", "zubehoer", "tore", "sichtschutz", "gitter"] },
    { id: "verkehr", label: "Verkehrsabsicherung & Schilder", shops: ["schilder", "verkehr"] },
    { id: "anhaenger", label: "Anhänger", shops: ["anhaenger"] }
  ];
  var alias = { schilder: "verkehr", absperrung: "verkehr" };
  var byId = {};
  list.forEach(function (gruppe) { byId[gruppe.id] = gruppe; });
  function canon(id) {
    var key = alias[id] || id || "";
    return byId[key] ? key : "";
  }
  window.AMK_GRUPPEN = { list: list, byId: byId, canon: canon };
})();
