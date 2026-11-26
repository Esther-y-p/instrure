(function () {
  "use strict";

  // Evita iniciar a central duas vezes
  if (window.acessibilidadeIniciada) return;
  window.acessibilidadeIniciada = true;

  function iniciarAcessibilidade() {

    // =====================================
    // ATALHO PARA PULAR CONTEÚDO
    // =====================================

    const atalho = document.createElement("a");

    atalho.className = "ac-pular";
    atalho.href = "#conteudo-principal";
    atalho.textContent = "Pular para o conteúdo";

    document.body.appendChild(atalho);

    // =====================================
    // CRIAR PAINEL
    // =====================================

    const widget = document.createElement("div");

    widget.className = "ac-widget";

    widget.innerHTML = `
      <button
        class="ac-botao"
        id="ac-abrir"
        type="button"
        aria-label="Abrir central de acessibilidade"
        aria-expanded="false"
        aria-controls="ac-painel">
        ♿
      </button>

      <section
        class="ac-painel"
        id="ac-painel"
        aria-label="Central de acessibilidade"
        hidden>

        <h2>Acessibilidade</h2>

        <div class="ac-grupo">
          <h3>Leitura em áudio</h3>

          <div class="ac-linha">
            <button id="ac-ouvir" type="button">
              🔊 Ouvir
            </button>

            <button id="ac-pausar" type="button">
              ⏸ Pausar
            </button>

            <button id="ac-parar" type="button">
              ⏹ Parar
            </button>
          </div>
        </div>

        <div class="ac-grupo">
          <h3>Tamanho do texto</h3>

          <div class="ac-linha">
            <button id="ac-aumentar" type="button">
              A+
            </button>

            <button id="ac-diminuir" type="button">
              A-
            </button>

            <button id="ac-resetar" type="button">
              Padrão
            </button>
          </div>
        </div>

        <div class="ac-grupo">
          <h3>Visualização</h3>

          <button
            id="ac-contraste"
            type="button"
            aria-pressed="false">
            ◐ Alto contraste
          </button>
        </div>

        <button
          id="ac-fechar"
          class="ac-fechar"
          type="button">
          Fechar painel
        </button>

        <p
          id="ac-status"
          class="ac-status"
          role="status"
          aria-live="polite">
        </p>
      </section>
    `;

    document.body.appendChild(widget);

    // =====================================
    // ELEMENTOS
    // =====================================

    function elemento(id) {
      return document.getElementById(id);
    }

    const botao = elemento("ac-abrir");
    const painel = elemento("ac-painel");
    const status = elemento("ac-status");

    function informar(mensagem) {
      status.textContent = mensagem;
    }

    // =====================================
    // ABRIR E FECHAR PAINEL
    // =====================================

    botao.addEventListener("click", function () {

      const abrir = painel.hidden;

      painel.hidden = !abrir;

      botao.setAttribute(
        "aria-expanded",
        String(abrir)
      );

      if (abrir) {
        elemento("ac-ouvir").focus();
      }
    });

    elemento("ac-fechar").addEventListener(
      "click",
      function () {

        painel.hidden = true;

        botao.setAttribute(
          "aria-expanded",
          "false"
        );

        botao.focus();
      }
    );

    document.addEventListener("keydown", function (event) {

      if (
        event.key === "Escape" &&
        !painel.hidden
      ) {

        painel.hidden = true;

        botao.setAttribute(
          "aria-expanded",
          "false"
        );

        botao.focus();
      }
    });

    // =====================================
    // TAMANHO DO TEXTO
    // =====================================

    let escala = 1;

    const tamanhosOriginais = new WeakMap();

    function atualizarFonte() {

      const conteudo =
        document.querySelector("[data-leitor]") ||
        document.querySelector("#conteudo-principal");

      if (!conteudo) {
        informar("Conteúdo principal não encontrado.");
        return;
      }

      const elementosTexto = conteudo.querySelectorAll(
        "h1, h2, h3, h4, h5, h6, p, a, span, li, button, label, small, strong, em, blockquote, figcaption, td, th"
      );

      elementosTexto.forEach(function (elemento) {

        // Guarda o tamanho original uma única vez
        if (!tamanhosOriginais.has(elemento)) {

          const estilo = window.getComputedStyle(elemento);

          tamanhosOriginais.set(elemento, {
            tamanho: parseFloat(estilo.fontSize),
            tamanhoOriginal: elemento.style.getPropertyValue("font-size"),
            prioridade: elemento.style.getPropertyPriority("font-size")
          });
        }

        const original =
          tamanhosOriginais.get(elemento);

        if (escala === 1) {

          // Restaura o tamanho original
          elemento.style.removeProperty("font-size");

          if (original.tamanhoOriginal) {

            elemento.style.setProperty(
              "font-size",
              original.tamanhoOriginal,
              original.prioridade
            );
          }

        } else {

          // Aplica o tamanho ajustado
          elemento.style.setProperty(
            "font-size",
            (original.tamanho * escala) + "px",
            "important"
          );
        }
      });
    }

    elemento("ac-aumentar").addEventListener(
      "click",
      function () {

        escala = Math.min(
          1.5,
          escala + 0.1
        );

        atualizarFonte();

        informar("Fonte aumentada.");
      }
    );

    elemento("ac-diminuir").addEventListener(
      "click",
      function () {

        escala = Math.max(
          0.8,
          escala - 0.1
        );

        atualizarFonte();

        informar("Fonte diminuída.");
      }
    );

    elemento("ac-resetar").addEventListener(
      "click",
      function () {

        escala = 1;

        atualizarFonte();

        informar("Tamanho original restaurado.");
      }
    );

    // =====================================
    // ALTO CONTRASTE
    // =====================================

    const contraste = elemento("ac-contraste");

    contraste.addEventListener(
      "click",
      function () {

        const ativo =
          document.body.classList.toggle(
            "ac-alto-contraste"
          );

        contraste.setAttribute(
          "aria-pressed",
          String(ativo)
        );

        informar(
          ativo
            ? "Alto contraste ativado."
            : "Alto contraste desativado."
        );
      }
    );

    // =====================================
    // LEITOR DE TEXTO
    // =====================================

    let frases = [];
    let indice = 0;
    let lendo = false;
    let identificador = 0;

    function cancelarLeitura() {

      identificador++;

      lendo = false;

      if ("speechSynthesis" in window) {
        speechSynthesis.cancel();
      }
    }

    function obterTexto() {

      const area =
        document.querySelector("[data-leitor]") ||
        document.querySelector("#conteudo-principal") ||
        document.querySelector("main") ||
        document.querySelector("article");

      if (!area) {
        return "";
      }

      const copia = area.cloneNode(true);

      copia.querySelectorAll(
        "button, input, select, textarea, script, style, nav, [aria-hidden='true']"
      ).forEach(function (item) {
        item.remove();
      });

      return copia.innerText
        .replace(/\s+/g, " ")
        .trim();
    }

    function lerProximaFrase(id) {

      if (
        id !== identificador ||
        !lendo
      ) {
        return;
      }

      if (indice >= frases.length) {

        lendo = false;

        informar("Leitura concluída.");

        return;
      }

      const fala =
        new SpeechSynthesisUtterance(
          frases[indice]
        );

      fala.lang = "pt-BR";
      fala.rate = 1;
      fala.pitch = 1;

      const vozes =
        speechSynthesis.getVoices();

      const vozPortugues =
        vozes.find(function (voz) {
          return voz.lang.toLowerCase() === "pt-br";
        });

      if (vozPortugues) {
        fala.voice = vozPortugues;
      }

      fala.onend = function () {

        if (
          id !== identificador ||
          !lendo
        ) {
          return;
        }

        indice++;

        lerProximaFrase(id);
      };

      fala.onerror = function (event) {

        if (id !== identificador) {
          return;
        }

        if (
          event.error === "canceled" ||
          event.error === "interrupted"
        ) {
          return;
        }

        lendo = false;

        informar(
          "Não foi possível continuar a leitura."
        );
      };

      speechSynthesis.speak(fala);
    }

    elemento("ac-ouvir").addEventListener(
      "click",
      function () {

        if (!("speechSynthesis" in window)) {

          informar(
            "Seu navegador não oferece leitura em voz alta."
          );

          return;
        }

        cancelarLeitura();

        const texto = obterTexto();

        if (!texto) {

          informar(
            "Não encontramos conteúdo para ler."
          );

          return;
        }

        frases =
          texto.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ||
          [texto];

        indice = 0;
        lendo = true;

        const id = identificador;

        informar("Iniciando leitura...");

        lerProximaFrase(id);
      }
    );

    // =====================================
    // PAUSAR E CONTINUAR
    // =====================================

    elemento("ac-pausar").addEventListener(
      "click",
      function () {

        if (!("speechSynthesis" in window)) {
          return;
        }

        if (speechSynthesis.paused) {

          speechSynthesis.resume();

          informar("Leitura retomada.");

        } else if (speechSynthesis.speaking) {

          speechSynthesis.pause();

          informar("Leitura pausada.");

        } else {

          informar(
            "Inicie a leitura primeiro."
          );
        }
      }
    );

    // =====================================
    // PARAR LEITURA
    // =====================================

    elemento("ac-parar").addEventListener(
      "click",
      function () {

        cancelarLeitura();

        frases = [];
        indice = 0;

        informar("Leitura interrompida.");
      }
    );

    // =====================================
    // LIMPAR AO SAIR DA PÁGINA
    // =====================================

    window.addEventListener(
      "pagehide",
      cancelarLeitura
    );
  }

  // =====================================
  // INICIALIZAÇÃO
  // =====================================

  if (document.readyState === "loading") {

    document.addEventListener(
      "DOMContentLoaded",
      iniciarAcessibilidade,
      { once: true }
    );

  } else {

    iniciarAcessibilidade();
  }

})();