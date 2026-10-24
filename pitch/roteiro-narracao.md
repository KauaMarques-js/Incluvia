# Pitch Incluvia — roteiro de narração (até 3 min)

**Vídeo:** `pitch/incluvia-pitch.mp4` (MP4 H.264, 1920×1080, 2min38s, sem áudio)
**Legendas prontas:** `pitch/legendas.srt` (mesmo texto da narração, sincronizado com o vídeo)

Tempo total: **cartão de abertura (~10 s) + vídeo (2:38) + cartão de encerramento (~8 s) ≈ 2:56**.
Sem os cartões, a frase de abertura cabe no início do Painel (0:06) e a de encerramento no fim da cena do VLibras.

Ritmo: calmo, cerca de 2 palavras por segundo. Os tempos abaixo são do vídeo, sem os cartões.

---

## Abertura — cartão com o nome Incluvia (~10 s, antes do vídeo)

> Sites e sistemas de inteligência artificial ainda excluem pessoas com deficiência. Isso tem nome: capacitismo algorítmico. A Incluvia ajuda equipes a encontrar e corrigir essas barreiras.

**Texto na tela:** Incluvia · Auditoria de acessibilidade e capacitismo algorítmico

---

## 1. Login — 0:00 a 0:06

> O acesso é restrito a pessoas auditoras. Entramos com a conta de demonstração.

## 2. Painel — 0:06 a 0:16

> O painel mostra projetos, sites e auditorias recentes. O fluxo é sempre o mesmo: projeto, alvo autorizado, auditoria, revisão humana e relatório.

**Texto na tela:** Projeto → Alvo → Auditoria → Revisão humana → Relatório

## 3. Projeto — 0:16 a 0:23

> Cada projeto reúne os sites que serão auditados e as avaliações de respostas de inteligência artificial.

## 4. Cadastro de alvo — 0:23 a 0:42

> Para cadastrar um site, informamos nome e endereço e confirmamos a autorização formal: sem ela, nada é testado. A segurança vem de fábrica: endereços de rede interna são bloqueados para impedir ataques. Com uma URL pública, o alvo é cadastrado.

**Texto na tela:** Autorização obrigatória · Bloqueio de redes internas

## 5. Preparar auditoria — 0:42 a 0:51

> Antes de iniciar, definimos o escopo: limite de páginas e profundidade. A auditoria entra na fila e roda em segundo plano.

## 6. Resultados — 0:51 a 1:01

> Esta é uma auditoria já concluída. O axe-core verificou critérios da WCAG 2.2, e o resumo mostra os achados por severidade.

**Texto na tela:** WCAG 2.2 · Playwright + axe-core

## 6b. Revisão humana — 1:01 a 1:17

> Filtramos os críticos. Cada achado mostra a página, o elemento e como corrigir. Mas automação não é veredito: uma pessoa confirma ou descarta cada achado. Aqui, a barreira foi confirmada com o leitor de tela NVDA.

**Texto na tela:** A automação aponta, as pessoas decidem

## 6c. Relatório — 1:17 a 1:27

> Com um clique, o relatório em Markdown reúne escopo, limitações, achados e o estado da revisão humana, pronto para a equipe de desenvolvimento.

## 7. Avaliação de IA: preparar — 1:27 a 1:49

> Agora, a inteligência artificial. Escolhemos um cenário de crédito para uma mulher negra cadeirante. A Incluvia faz a mesma pergunta duas vezes: com a menção à cadeira de rodas e sem ela. Todo o resto é idêntico. Nesta demonstração, as respostas vêm do simulador da plataforma.

**Texto na tela:** Mesma pergunta, com e sem a deficiência

## 7b. Avaliação de IA: resultado — 1:49 a 2:14

> O resultado: sem a deficiência, as três respostas aprovam o financiamento. Com a deficiência, duas de três negam. Não há nenhuma palavra ofensiva, mas há tratamento desigual, que uma busca por palavras não pegaria. A Incluvia aponta o trecho, sugere a correção para o sistema e mostra as respostas lado a lado.

**Texto na tela:** Sem deficiência: 3 de 3 aprovam · Com deficiência: 2 de 3 negam

## 8. VLibras — 2:14 a 2:38

> E a própria Incluvia pratica o que defende: navegação por teclado, contraste verificado, nenhuma violação automática do axe-core nas telas principais e o VLibras, ferramenta oficial do governo federal, que traduz o conteúdo para Libras. Aqui, o avatar traduz o texto do painel.

**Texto na tela:** VLibras integrado · WCAG 2.2 AA como meta de projeto

---

## Encerramento — cartão final (~8 s, depois do vídeo)

> Incluvia: evidência técnica e revisão humana contra o capacitismo digital. Tecnologia inclusiva começa removendo barreiras.

**Texto na tela:** Incluvia · Evidência técnica + revisão humana

---

## Para responder se perguntarem

- **"As respostas da IA são reais?"** No vídeo, vêm do simulador de demonstração, e a tela avisa isso. Em uso real, a pessoa auditora cola respostas de qualquer sistema (chatbot da empresa, ChatGPT, Gemini) ou gera com a API do Claude, se a chave estiver configurada.
- **"Por que comparar duas perguntas?"** Porque viés é tratar alguém de forma diferente. Procurar palavras ofensivas pega o óbvio; comparar a mesma situação com e sem a deficiência pega a discriminação disfarçada, como a negação de crédito do vídeo.
- **"E se a IA variar a cada resposta?"** Cada pergunta é repetida (de 1 a 5 vezes) e cada achado mostra a frequência, por exemplo "2 de 3 respostas".
- **"Como acompanhar melhorias?"** "Repetir avaliação" refaz o teste em uma nova versão do modelo, e a tela mostra a evolução em relação à anterior.

## Cuidados com a mensagem

- Fale em **indícios** e **achados**, nunca em "certificação" ou "site livre de capacitismo".
- A auditoria web concluída e as respostas de IA são **dados de demonstração**; o vídeo e a tela deixam isso claro.
- Os cenários de IA ainda serão **validados com consultores com deficiência**; não diga que já foram.
- `example.com` e `example.org` são domínios reservados para exemplos.

## Como regravar

Com o app em produção apontando para um banco separado (para um worker local não processar as ações da gravação):

```bash
cp prisma/dev.db prisma/pitch-demo.db
```

```bash
npm run build
```

```bash
DATABASE_URL="file:./pitch-demo.db" npx next start -p 3100
```

```bash
node pitch/gravar-video.cjs http://localhost:3100
```

O script usa o Microsoft Edge instalado, grava `pitch/incluvia-pitch.mp4` e atualiza `pitch/marcacoes.json` com o início de cada cena.
