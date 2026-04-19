document.addEventListener("DOMContentLoaded", function () {
  const titleSection = document.getElementById("Title");
  const ingredientsSection = document.getElementById("Ingredients");
  const timeSection = document.getElementById("Time");
  if (!titleSection || !ingredientsSection || !timeSection) return;

  /* =========================
     DETECT ORIGINAL SERVINGS
     ========================= */
  let titleText = "";
  const titleP = titleSection.querySelector("p");
  if (titleP) titleText = titleP.textContent || titleP.innerText || "";
  titleText = titleText.replace(/\u00A0/g, " ").replace(/[–—−]/g, "-").trim();

  let originalServingsText = "12";
  let originalServingsValue = 12;

  const match = titleText.match(/Makes\s*(\d+)(?:-(\d+))?/i);
  if (match) {
    const a = parseInt(match[1], 10);
    const b = match[2] !== undefined ? parseInt(match[2], 10) : null;
    if (b !== null) {
      originalServingsText = `${a}–${b}`;
      originalServingsValue = Math.max(1, Math.round((a + b) / 2));
    } else {
      originalServingsText = `${a}`;
      originalServingsValue = Math.max(1, a);
    }
  }

  /* =========================
     UI
     ========================= */
  const converterDiv = document.createElement("div");
  converterDiv.style.cssText = `
    text-align:center;
    margin:20px auto;
    padding:16px;
    border-radius:12px;
    max-width:340px;
    font-size:16px;
    background:rgba(255,255,255,0.25);
    backdrop-filter:blur(6px);
    border:1px solid rgba(0,0,0,0.1);
    box-shadow:0 2px 8px rgba(0,0,0,0.15);
    color:black;
  `;
  converterDiv.innerHTML = `
    <strong>Adjust Servings</strong><br><br>

    <div style="display:flex; justify-content:center; align-items:center; gap:10px;">
      <button id="minusServings">−</button>

      <input
        type="number"
        id="newServings"
        min="1"
        step="1"
        value="${originalServingsValue}"
        style="width:70px; text-align:center;"
      >

      <button id="plusServings">+</button>
    </div>

    <input
      type="range"
      id="servingsSlider"
      min="1"
      max="${Math.max(12, originalServingsValue * 3)}"
      step="1"
      value="${originalServingsValue}"
      style="width:100%; margin-top:10px;"
    >

    <div style="margin-top:8px;">
      Original: <span id="originalServings">${originalServingsText}</span>
    </div>

    <button id="resetServings" style="margin-top:8px;">
      Reset
    </button>
  `;
  titleSection.parentNode.insertBefore(converterDiv, titleSection.nextSibling);

  const newServingsInput = document.getElementById("newServings");
  const minusBtn = document.getElementById("minusServings");
  const plusBtn = document.getElementById("plusServings");
  const slider = document.getElementById("servingsSlider");
  const resetBtn = document.getElementById("resetServings");

  /* =========================
     HELPERS
     ========================= */
  function clamp(v) {
    v = Math.round(parseFloat(v));
    if (isNaN(v) || v < 1) return 1;
    return v;
  }

  function sync(v) {
    v = clamp(v);
    newServingsInput.value = v;
    slider.value = v;
    convertRecipe();
  }

  minusBtn.onclick = () => sync(newServingsInput.value - 1);
  plusBtn.onclick = () => sync(+newServingsInput.value + 1);
  resetBtn.onclick = () => sync(originalServingsValue);
  newServingsInput.oninput = () => sync(newServingsInput.value);
  slider.oninput = () => sync(slider.value);

  /* =========================
     FRACTION & UNIT HELPERS
     ========================= */
  const unicodeFractions = {
    "½":"1/2","⅓":"1/3","⅔":"2/3","¼":"1/4","¾":"3/4",
    "⅕":"1/5","⅖":"2/5","⅗":"3/5","⅘":"4/5",
    "⅙":"1/6","⅚":"5/6","⅛":"1/8","⅜":"3/8","⅝":"5/8","⅞":"7/8"
  };

  function normalizeFraction(s){
    return s.replace(/[\u00BC-\u00BE\u2150-\u215E]/g, c => unicodeFractions[c] || c);
  }

  function parseAmount(s){
    s = normalizeFraction(s.trim());
    let m = s.match(/^(\d+)\s+(\d+)\/(\d+)/);
    if (m) return +m[1] + m[2]/m[3];
    m = s.match(/^(\d+)\/(\d+)/);
    if (m) return m[1]/m[2];
    let n = parseFloat(s);
    return isNaN(n)?0:n;
  }

  function toFraction(v){
    const commonFractions=[[1,2],[1,3],[2,3],[1,4],[3,4],[1,8],[3,8],[5,8],[7,8]];
    const w = Math.floor(v);
    let r = v - w;
    for(let [n,d] of commonFractions){
      if(Math.abs(r-n/d)<0.02) return (w?w+" ":"")+n+"/"+d;
    }
    return w ? w.toString() : v.toFixed(2);
  }

  /* =========================
     UNIT HIERARCHY
     ========================= */
  const unitHierarchy = {
    tsp:  { next: "tbsp", factor: 3, prev: null },
    tbsp: { next: "cup", factor: 16, prev: "tsp" },
    cup:  { next: "pt", factor: 2, prev: "tbsp" },
    pt:   { next: "qt", factor: 2, prev: "cup" },
    qt:   { next: "gal", factor: 4, prev: "pt" },
    gal:  { next: null, factor: null, prev: "qt" },

    ml:   { next: "cl", factor: 10, prev: null },
    cl:   { next: "dl", factor: 10, prev: "ml" },
    dl:   { next: "l", factor: 10, prev: "cl" },
    l:    { next: null, factor: null, prev: "dl" },

    mg:   { next: "g", factor: 1000, prev: null },
    g:    { next: "kg", factor: 1000, prev: "mg" },
    kg:   { next: null, factor: null, prev: "g" },

    oz:   { next: "lb", factor: 16, prev: null },
    lb:   { next: "ton", factor: 2000, prev: "oz" },
    ton:  { next: null, factor: null, prev: "lb" }
  };

  /* =========================
     TINY UNITS
     ========================= */
  const tinyVolumeUnits = [
    {limit: 0.0625, name: "pinch"},  // 1/16 tsp
    {limit: 0.125,  name: "dash"},   // 1/8 tsp
    {limit: 0.25,   name: "smidgen"} // 1/4 tsp
  ];

  const tinyWeightUnits = [
    {limit: 0.01, name: "10 mg"},
    {limit: 0.1,  name: "100 mg"},
    {limit: 1,    name: "g"}
  ];

  /* =========================
     SPLIT UNITS FUNCTION
     ========================= */
  function splitUnits(amount, unit) {
    if (!unit) return toFraction(amount);

    let val = amount;
    let u = unit.toLowerCase();

    // Handle tiny volume
    if (["tsp","tbsp","cup"].includes(u) && val < 1) {
      for (let tu of tinyVolumeUnits) {
        if (val <= tu.limit) return tu.name;
      }
    }

    // Handle tiny weight
    if (["g","kg","mg","oz","lb"].includes(u) && val < 1) {
      if (u === "g") return Math.round(val*1000) + " mg";
      if (u === "kg") return Math.round(val*1000000) + " mg";
      if (u === "mg") return val + " mg";
      if (u === "oz") return (val*28.3495).toFixed(1) + " g";
      if (u === "lb") return (val*16).toFixed(2) + " oz";
    }

    let result = [];

    // SCALE DOWN for small amounts
    while (unitHierarchy[u] && val < 1 && unitHierarchy[u].prev) {
      const prev = unitHierarchy[u].prev;
      val *= unitHierarchy[prev].factor;
      u = prev;
    }

    // SCALE UP for large amounts
    while (unitHierarchy[u] && unitHierarchy[u].next && unitHierarchy[u].factor && val >= unitHierarchy[u].factor) {
      const whole = Math.floor(val / unitHierarchy[u].factor);
      if (whole > 0) result.push(whole + " " + unitHierarchy[u].next);
      val = val % unitHierarchy[u].factor;
      u = unitHierarchy[u].next;
    }

    // Remaining amount in current unit
    if (val > 0) result.push(toFraction(val) + " " + u);

    return result.join(" ");
  }

  /* =========================
     TO FRACTION FUNCTION
     ========================= */
  function toFraction(value) {
    const tolerance = 1e-2;
    if (Math.abs(value) < tolerance) return "0";

    const whole = Math.floor(value);
    let frac = value - whole;

    if (frac < tolerance) return whole.toString();

    const commonFractions = [
      {n:1, d:2}, {n:1, d:3}, {n:2, d:3},
      {n:1, d:4}, {n:3, d:4},
      {n:1, d:8}, {n:3, d:8}, {n:5, d:8}, {n:7, d:8}
    ];

    let closest = null;
    let minDiff = Infinity;
    for (let f of commonFractions) {
      const diff = Math.abs(frac - f.n/f.d);
      if (diff < minDiff) {
        minDiff = diff;
        closest = f;
      }
    }

    if (closest === null || minDiff < tolerance) return whole.toString();
    if (closest.n === closest.d) return (whole + 1).toString();

    return (whole > 0 ? whole + " " : "") + closest.n + "/" + closest.d;
  }

  /* =========================
     STORE ORIGINAL INGREDIENTS & TIME
     ========================= */
  const ingredientItems = ingredientsSection.querySelectorAll("ul li");
  ingredientItems.forEach(li => li._orig = li.textContent);

  const prepEl = timeSection.querySelector("li:nth-child(1)");
  const cookEl = timeSection.querySelector("li:nth-child(2)");
  const totalEl = timeSection.querySelector("li:nth-child(3)");

  function parseTime(t){ const m=t.match(/(\d+)/); return m?+m[1]:0; }
  const tPrep = prepEl?parseTime(prepEl.textContent):0;
  const tCook = cookEl?parseTime(cookEl.textContent):0;
  const tTotal = totalEl?parseTime(totalEl.textContent):0;
  function formatTime(m){ if(m<60) return m+" min"; return Math.floor(m/60)+" hr "+(m%60||""); }

  /* =========================
     REALISTIC TIME SCALING
     ========================= */
  function scaleTime(originalTime, newServings, originalServings, type) {
    const ratio = newServings / originalServings;

    if (type === "prep") {
      return Math.round(originalTime * Math.sqrt(ratio));
    } else if (type === "cook") {
      return Math.round(originalTime * (1 + (ratio - 1) * 0.25));
    } else { // total
      return Math.round(
        scaleTime(tPrep, newServings, originalServings, "prep") +
        scaleTime(tCook, newServings, originalServings, "cook")
      );
    }
  }

  /* =========================
     CONVERT RECIPE
     ========================= */
  function convertRecipe(){
    const s = clamp(newServingsInput.value);

    ingredientItems.forEach(li => {
      const txt = normalizeFraction(li._orig);
      const m = txt.match(/^([\d\s\/\.]+)\s*([a-zA-Z]+)?\s*(.*)/);
      if(!m) return;

      const amt=parseAmount(m[1]);
      const scaled=(amt*s)/originalServingsValue;
      li.textContent = splitUnits(scaled, m[2]||"") + (m[3]?" "+m[3]:"");
    });

    if(prepEl) prepEl.textContent = "Prep Time: ~" + formatTime(scaleTime(tPrep, s, originalServingsValue, "prep"));
    if(cookEl) cookEl.textContent = "Cook Time: ~" + formatTime(scaleTime(tCook, s, originalServingsValue, "cook"));
    if(totalEl) totalEl.textContent = "Total Time: ~" + formatTime(scaleTime(tTotal, s, originalServingsValue, "total"));
  }
});