<script setup lang="ts">
// Rodapé de divulgação: onde fica a escola, quando abre e como agendar.
</script>

<template>
  <footer class="escola-rodape">
    <div class="dentro">
      <section class="convite" aria-labelledby="convite-titulo">
        <img src="/logo-128.png" alt="Escola Mundo Lúdico" width="96" height="96" loading="lazy">
        <div>
          <h2 id="convite-titulo">Seu filho também pode criar jogos</h2>
          <p>
            Na Escola Mundo Lúdico, a criança aprende programando o próprio jogo, do primeiro
            desenho ao último ponto do placar. Venha conhecer.
          </p>
          <BotaoAgendar tamanho="grande" />
        </div>
      </section>

      <section class="bloco" aria-labelledby="onde-titulo">
        <h3 id="onde-titulo">Onde estamos</h3>
        <address>
          <span v-for="linha in ENDERECO_LINHAS" :key="linha">{{ linha }}</span>
        </address>
        <a :href="MAPA_LINK" target="_blank" rel="noopener noreferrer" class="link-forte">
          Ver no Google Maps ›
        </a>
        <p class="contato">
          WhatsApp:
          <a :href="WHATSAPP_LINK" target="_blank" rel="noopener noreferrer">{{ WHATSAPP_EXIBICAO }}</a>
        </p>
      </section>

      <section class="bloco" aria-labelledby="horario-titulo">
        <h3 id="horario-titulo">Funcionamento</h3>
        <dl class="horarios">
          <template v-for="h in HORARIOS" :key="h.dias">
            <dt>{{ h.dias }}</dt>
            <dd :class="{ fechado: h.horas === 'Fechado' }">{{ h.horas }}</dd>
          </template>
        </dl>
      </section>
    </div>
    <p class="assinatura">© {{ ESCOLA_NOME }} · Franca - SP</p>
  </footer>
</template>
