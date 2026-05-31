import { gsap } from "gsap";

document.addEventListener("DOMContentLoaded", () => {
  // Mobile Nav Toggle
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");
  const header = document.querySelector(".site-header");

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("is-open");
      header.classList.toggle("menu-open", isOpen);
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.textContent = isOpen ? "[-]" : "[+]";
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("is-open");
        header.classList.remove("menu-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.textContent = "[+]";
      });
    });
  }

  // Pricing Tabs Group
  const tabGroup = document.querySelector("[data-tab-group]");
  if (tabGroup) {
    const buttons = tabGroup.querySelectorAll(".tab-button");
    const panels = tabGroup.querySelectorAll(".tab-panel");

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.tabTarget;
        
        buttons.forEach((b) => {
          b.setAttribute("aria-selected", "false");
        });
        btn.setAttribute("aria-selected", "true");

        panels.forEach((p) => {
          if (p.dataset.tabPanel === target) {
            p.removeAttribute("hidden");
            gsap.fromTo(p, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4 });
          } else {
            p.setAttribute("hidden", "true");
          }
        });
      });
    });
  }

  // Footer Year
  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = String(new Date().getFullYear());
  }

  // Metric Countups
  const countElements = document.querySelectorAll(".stat strong");
  if (countElements.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const target = entry.target;
        const countTo = parseFloat(target.dataset.count || "0");
        const suffix = target.dataset.suffix || "";
        
        const counter = { val: 0 };
        gsap.to(counter, {
          val: countTo,
          duration: 1.8,
          ease: "power2.out",
          onUpdate: () => {
            target.textContent = `${Math.round(counter.val)}${suffix}`;
          }
        });
        observer.unobserve(target);
      });
    }, { threshold: 0.5 });

    countElements.forEach((el) => observer.observe(el));
  }

  // GSAP animations
  gsap.from(".ops-hero .eyebrow, .ops-hero .display, .ops-hero .lead, .ops-hero .cluster", {
    y: 35,
    opacity: 0,
    duration: 1.2,
    stagger: 0.15,
    ease: "power3.out"
  });

  gsap.from(".route-map", {
    x: 40,
    opacity: 0,
    duration: 1.2,
    ease: "power3.out",
    delay: 0.4
  });
});

// Custom Web Component for Delivery Cost & SLA Calculator
class DeliveryCostCalculator extends HTMLElement {
  constructor() {
    super();
    this.zone = "local"; // local, regional, international
    this.weight = 5.0;   // in kg
    this.urgency = "std"; // std, express, priority

    // Rate card details
    this.rates = {
      local: { base: 6.5, perKg: 1.8, distFactor: 1 },
      regional: { base: 18.0, perKg: 3.5, distFactor: 4 },
      international: { base: 65.0, perKg: 14.0, distFactor: 24 }
    };

    this.urgencies = {
      std: { label: "Standard", factor: 1.0 },
      express: { label: "Express Overnight", factor: 1.35 },
      priority: { label: "Priority Same-Day", factor: 1.75 }
    };
  }

  connectedCallback() {
    this.render();
    this.setupListeners();
    this.calculate(true);
  }

  render() {
    this.innerHTML = `
      <div class="calc-inputs-group">
        <div class="calc-row">
          <label>Zona de Destino</label>
          <div class="select-button-grid" id="zone-selector">
            <button type="button" class="select-btn active" data-zone="local">Local</button>
            <button type="button" class="select-btn" data-zone="regional">Regional</button>
            <button type="button" class="select-btn" data-zone="international">Mundial</button>
          </div>
        </div>

        <div class="calc-row">
          <label for="weight-slider">
            <span>Peso Estimado</span>
            <span class="calc-val" id="weight-val">5.0 kg</span>
          </label>
          <input type="range" id="weight-slider" min="0.5" max="50" step="0.5" value="5.0">
        </div>

        <div class="calc-row">
          <label>Prioridad de Envío</label>
          <div class="select-button-grid" id="urgency-selector">
            <button type="button" class="select-btn active" data-urgency="std">Standard</button>
            <button type="button" class="select-btn" data-urgency="express">Express</button>
            <button type="button" class="select-btn" data-urgency="priority">Prioritario</button>
          </div>
        </div>
      </div>

      <div class="calc-results-box">
        <div class="result-item">
          <span class="result-label">Costo Estimado</span>
          <div class="result-value orange" id="res-cost">$0.00 USD</div>
          <div class="result-note">Incluye preparación de packing básico</div>
        </div>

        <div class="result-item">
          <span class="result-label">SLA de Entrega</span>
          <div class="result-value" id="res-sla">24 horas</div>
          <div class="result-note">Compromiso garantizado en contrato</div>
        </div>

        <div class="result-item">
          <span class="result-label">Compensación CO2</span>
          <div class="result-value" style="font-size:1.50rem; color:var(--text-muted);" id="res-co2">0.0 kg CO2</div>
          <div class="result-note">Compensado 100% mediante bonos forestales</div>
        </div>
      </div>
    `;
  }

  setupListeners() {
    const weightSlider = this.querySelector("#weight-slider");
    const zoneBtns = this.querySelectorAll("#zone-selector .select-btn");
    const urgencyBtns = this.querySelectorAll("#urgency-selector .select-btn");

    weightSlider.addEventListener("input", (e) => {
      this.weight = parseFloat(e.target.value);
      this.querySelector("#weight-val").textContent = `${this.weight.toFixed(1)} kg`;
      this.calculate();
    });

    zoneBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        zoneBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.zone = btn.dataset.zone;
        this.calculate();
      });
    });

    urgencyBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        urgencyBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.urgency = btn.dataset.urgency;
        this.calculate();
      });
    });
  }

  calculate(isInitial = false) {
    const rate = this.rates[this.zone];
    const urg = this.urgencies[this.urgency];

    // Compute Cost
    const baseCost = (rate.base + (this.weight * rate.perKg)) * urg.factor;
    
    // Compute SLA Timeframes
    let sla = "";
    if (this.zone === "local") {
      if (this.urgency === "std") sla = "24 a 48 Horas";
      else if (this.urgency === "express") sla = "Siguiente Mañana";
      else sla = "Mismo Día (Prioridad)";
    } else if (this.zone === "regional") {
      if (this.urgency === "std") sla = "3 a 5 Días Hábiles";
      else if (this.urgency === "express") sla = "48 Horas Max";
      else sla = "Siguiente Día (Express)";
    } else {
      if (this.urgency === "std") sla = "10 a 14 Días Hábiles";
      else if (this.urgency === "express") sla = "4 a 6 Días Hábiles";
      else sla = "SLA Aéreo (Prioritario)";
    }

    // Compute CO2 offset footprint: weight * 0.08 * distance factor
    const co2Val = this.weight * 0.085 * rate.distFactor;

    // Output elements
    const costText = this.querySelector("#res-cost");
    const slaText = this.querySelector("#res-sla");
    const co2Text = this.querySelector("#res-co2");

    slaText.textContent = sla;

    if (isInitial) {
      costText.textContent = `$${baseCost.toFixed(2)} USD`;
      co2Text.textContent = `${co2Val.toFixed(2)} kg CO2`;
    } else {
      // Animate counting numbers using GSAP
      gsap.killTweensOf([costText, co2Text]);

      const costObj = { cost: parseFloat(costText.textContent.replace(/[^0-9.-]+/g, "")) || 0 };
      gsap.to(costObj, {
        cost: baseCost,
        duration: 0.45,
        ease: "power2.out",
        onUpdate: () => {
          costText.textContent = `$${costObj.cost.toFixed(2)} USD`;
        }
      });

      const co2Obj = { co2: parseFloat(co2Text.textContent) || 0 };
      gsap.to(co2Obj, {
        co2: co2Val,
        duration: 0.45,
        ease: "power2.out",
        onUpdate: () => {
          co2Text.textContent = `${co2Obj.co2.toFixed(2)} kg CO2`;
        }
      });
    }
  }
}

customElements.define("delivery-cost-calculator", DeliveryCostCalculator);
