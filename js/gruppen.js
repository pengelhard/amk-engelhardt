(function () {
  var list = [
    { id: "zaun", label: "Bauzaun & Absperrgitter", shops: ["bauzaune", "zubehoer", "tore", "sichtschutz", "gitter"] },
    { id: "schilder", label: "Verkehrsschilder", shops: ["schilder"] },
    { id: "absperrung", label: "Verkehrsabsperreinrichtungen", shops: ["verkehr"] },
    { id: "anhaenger", label: "Anhänger", shops: ["anhaenger"] }
  ];
  var byId = {};
  list.forEach(function (gruppe) { byId[gruppe.id] = gruppe; });
  window.AMK_GRUPPEN = { list: list, byId: byId };
})();
