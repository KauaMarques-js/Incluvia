# Dossiê de Projeto: Capacitismo Algorítmico

## Viés em sistemas de inteligência artificial e tecnologias digitais que excluem pessoas com deficiência

**Versão:** 1.0\
**Data:** outubro de 2026\
**Tipo:** dossiê conceitual, pesquisa aplicada e planejamento
tecnológico\
**Uso previsto:** projeto acadêmico, pesquisa de inovação ou base para
um protótipo de tecnologia inclusiva

------------------------------------------------------------------------

## 1. Resumo executivo

O **capacitismo algorítmico** ocorre quando dados, modelos de
inteligência artificial (IA), regras automatizadas ou decisões de design
reproduzem ou ampliam barreiras e discriminações contra pessoas com
deficiência (PCDs). Isso pode acontecer por exclusão dos dados de
treinamento, por padrões de desempenho que privilegiam corpos e formas
de comunicação considerados "normais", por interfaces inacessíveis ou
por sistemas que tomam decisões relevantes sem considerar diferentes
necessidades funcionais.

O problema não se limita a algoritmos de IA. Também pode estar presente
em aplicativos, sites, autenticação biométrica, reconhecimento de voz,
recrutamento automatizado, plataformas educacionais, sistemas de
atendimento e serviços públicos digitais.

Este dossiê propõe desenvolver uma **Plataforma de Auditoria e
Acessibilidade Algorítmica (Incluvia)**: uma solução que combine testes
automatizados de acessibilidade, avaliação de respostas de IA, testes
com usuários com diferentes deficiências e um painel de evidências para
identificar, priorizar e acompanhar barreiras. A plataforma não deve
declarar, sozinha, que um sistema é "livre de capacitismo"; seu papel é
detectar riscos, documentá-los e apoiar decisões humanas.

**Princípio central:** a deficiência não é um erro a ser corrigido pela
tecnologia. O projeto deve remover barreiras, ampliar autonomia e
respeitar a diversidade de corpos, sentidos, comunicação e cognição.

## 2. Problema e justificativa

A digitalização de serviços essenciais faz com que sistemas
automatizados influenciem o acesso à educação, ao emprego, à informação,
à mobilidade e a serviços públicos. Quando esses sistemas não consideram
pessoas com deficiência, uma barreira antes localizada em um espaço
físico pode ser reproduzida em escala digital.

A Lei Brasileira de Inclusão (Lei nº 13.146/2015) reconhece barreiras
tecnológicas e de comunicação e estabelece princípios de acessibilidade
e desenho universal. Seus artigos 55, 77 e 78 tratam, entre outros
pontos, do desenho universal e do estímulo a tecnologias assistivas e à
pesquisa tecnológica. A WCAG 2.2, do W3C, fornece critérios técnicos
amplamente usados para tornar conteúdo web mais acessível. A
Recomendação da UNESCO sobre a Ética da IA alerta para o risco de
vieses, discriminação, exclusão digital e agravamento de desigualdades.

A relevância do tema também aparece na produção acadêmica recente sobre
vieses algorítmicos e representação de pessoas com deficiência em
sistemas generativos. Esses trabalhos ajudam a formular hipóteses e
métodos de investigação, mas cada afirmação específica deve ser
verificada por testes reproduzíveis no contexto do projeto.

### Pergunta norteadora

**Como identificar e reduzir barreiras capacitistas em sistemas digitais
e de inteligência artificial, sem transformar a auditoria em mais um
mecanismo de vigilância, estigmatização ou exclusão?**

### Hipótese de trabalho

Uma combinação de critérios de acessibilidade, testes comparativos,
participação remunerada de pessoas com deficiência e revisão humana
consegue identificar mais riscos relevantes do que testes automatizados
isolados.

## 3. Objetivos

### Objetivo geral

Projetar e validar uma metodologia tecnológica para detectar, documentar
e ajudar a reduzir barreiras de acessibilidade e vieses capacitistas em
sistemas digitais e de IA.

### Objetivos específicos

1.  Mapear formas de capacitismo algorítmico em contextos digitais.
2.  Definir critérios verificáveis para interface, conteúdo, interação e
    decisões automatizadas.
3.  Criar um protótipo de auditoria com testes automatizados e avaliação
    humana.
4.  Comparar resultados de sistemas em cenários equivalentes,
    respeitando privacidade e consentimento.
5.  Envolver pessoas com deficiência na concepção, nos testes e na
    priorização de melhorias.
6.  Produzir relatórios compreensíveis, rastreáveis e acionáveis para
    equipes técnicas.
7.  Avaliar a efetividade das correções e manter um ciclo contínuo de
    monitoramento.

## 4. Escopo e limites

### Dentro do escopo

-   Sites e aplicativos web.
-   Interfaces de chat e assistentes de IA.
-   Conteúdo textual, imagens geradas, legendas e transcrições.
-   Fluxos de cadastro, autenticação, formulários e atendimento.
-   Avaliação de compatibilidade com tecnologias assistivas.
-   Auditoria de diferenças de desempenho entre cenários de teste.
-   Recomendações de correção e acompanhamento de regressões.

### Fora do escopo inicial

-   Diagnosticar deficiência de pessoas.
-   Inferir deficiência a partir de imagem, voz, comportamento ou dados
    pessoais.
-   Decidir automaticamente elegibilidade para benefícios, emprego,
    educação ou saúde.
-   Certificar juridicamente um sistema como não discriminatório.
-   Substituir avaliação profissional de acessibilidade ou consulta a
    pessoas afetadas.

A primeira versão deve auditar sistemas sob autorização, em ambiente de
teste ou com dados públicos. Não deve executar testes intrusivos contra
serviços de terceiros sem permissão.

## 5. Como o capacitismo algorítmico pode aparecer

  --------------------------------------------------------------------------
  Área              Exemplo de risco  Possível          Como investigar
                                      consequência      
  ----------------- ----------------- ----------------- --------------------
  Reconhecimento de Falhas com fala   Comandos          Testes consentidos
  voz               atípica,          ignorados ou      com variedade de
                    disartria,        transcrições      falas e alternativas
                    sotaques ou       incorretas        de entrada
                    dispositivos de                     
                    comunicação                         

  Visão             Sistema           Classificação     Conjunto de testes
  computacional     interpreta        errada ou         diverso, análise de
                    incorretamente    tratamento        erros e revisão
                    cadeira de rodas, desigual          humana
                    próteses ou                         
                    movimentos                          
                    diversos                            

  IA generativa     Respostas que     Estereótipos e    Rubrica de avaliação
                    infantilizam      exclusão          com exemplos
                    PCDs, presumem    simbólica         positivos e
                    incapacidade ou                     negativos
                    apresentam                          
                    deficiência                         
                    apenas como                         
                    tragédia                            

  Geração de        Pouca             Invisibilidade e  Auditoria de prompts
  imagens           representação de  reforço de        equivalentes e
                    pessoas com       padrões corporais análise de
                    deficiência ou    restritos         representatividade
                    representações                      
                    estereotipadas                      

  Recrutamento      Penalização de    Exclusão de       Auditoria de
  automatizado      pausas, padrões   candidatos        critérios, revisão
                    de fala,          qualificados      de variáveis e
                    movimentos ou                       simulações
                    trajetórias não                     controladas
                    convencionais                       

  Educação digital  Atividade depende Participação      Testes com teclado,
                    apenas de áudio,  desigual          leitor de tela,
                    cor, arrastar e                     legendas e tempo
                    soltar ou tempo                     ajustável
                    curto                               

  Serviços públicos CAPTCHA           Impedimento de    Testes ponta a ponta
                    inacessível ou    acesso a direitos com tecnologias
                    fluxo sem         e serviços        assistivas
                    alternativa                         

  Autenticação      Biometria falha   Bloqueio de conta Oferecer
                    com diferenças    ou serviço        alternativas
                    físicas ou                          equivalentes e medir
                    limitações                          falhas por cenário
                    motoras                             

  Mapas e           Rotas ignoram     Rota insegura ou  Comparar rotas
  mobilidade        rampas,           impraticável      sugeridas com dados
                    elevadores,                         de acessibilidade
                    inclinações ou                      verificados
                    obstáculos                          

  Atendimento       Bot não entende   Abandono e        Testes com
  automatizado      Libras,           dependência de    diferentes canais e
                    comunicação       terceiros         possibilidade de
                    alternativa ou                      atendimento humano
                    linguagem simples                   
  --------------------------------------------------------------------------

Esses exemplos são **hipóteses de risco**, não afirmações de que todos
os sistemas dessas categorias falham. A auditoria deve coletar
evidências antes de classificar um caso.

## 6. Princípios de concepção

1.  **Participação desde o início:** pessoas com diferentes deficiências
    participam das decisões, não apenas de testes finais.
2.  **Desenho universal:** acessibilidade é requisito inicial, não um
    complemento posterior.
3.  **Autonomia e escolha:** oferecer formas alternativas de realizar
    uma tarefa, sem forçar a revelação de diagnóstico.
4.  **Não maleficência:** evitar testes que possam bloquear serviços,
    expor dados ou produzir constrangimento.
5.  **Transparência:** explicar critérios, limitações, fontes de dados e
    incertezas.
6.  **Contestabilidade:** permitir que uma pessoa questione uma decisão
    ou resultado automatizado.
7.  **Privacidade por padrão:** coletar o mínimo de dados, com
    finalidade e retenção definidas.
8.  **Interseccionalidade:** considerar que deficiência pode interagir
    com raça, gênero, idade, renda, idioma e contexto regional; não
    presumir experiências homogêneas.
9.  **Acessibilidade da própria plataforma:** a ferramenta de auditoria
    deve ser acessível a quem a utiliza.
10. **Responsabilidade humana:** decisões de alto impacto não devem
    depender exclusivamente de uma pontuação automática.

## 7. Proposta tecnológica: Plataforma de Auditoria e Acessibilidade Algorítmica (Incluvia)

### 7.1 Visão geral

A Incluvia seria uma aplicação web que organiza auditorias, executa testes
de acessibilidade, registra evidências, apoia avaliações humanas e gera
relatórios priorizados.

**Fluxo proposto:**

``` text
Definir sistema e escopo autorizado
            |
            v
Selecionar tarefas e perfis de acessibilidade
            |
            v
Executar testes automatizados e cenários controlados
            |
            v
Coletar evidências sem dados pessoais desnecessários
            |
            v
Revisão por avaliadores e participantes com deficiência
            |
            v
Classificar barreiras por impacto, frequência e confiança
            |
            v
Gerar recomendações técnicas e relatório acessível
            |
            v
Corrigir o sistema e repetir os testes
            |
            v
Monitorar regressões e publicar resultados autorizados
```

### 7.2 Módulos da plataforma

#### Módulo A --- Cadastro e escopo da auditoria

-   Nome do sistema, responsável, versão e ambiente testado.
-   Finalidade e público afetado.
-   Autorização para testar e limites de acesso.
-   Tarefas críticas: cadastro, busca, compra, inscrição, autenticação
    etc.
-   Registro de data, configuração e versão dos testes para
    reprodutibilidade.

#### Módulo B --- Verificação de acessibilidade

-   Varredura automatizada de páginas.
-   Verificação de nomes acessíveis, rótulos, hierarquia de títulos e
    textos alternativos.
-   Contraste de cores e identificação de dependência exclusiva de cor.
-   Navegação por teclado e visibilidade do foco, quando testável.
-   Identificação de campos sem instruções, mensagens de erro pouco
    claras e elementos sem semântica.
-   Relatório de critérios WCAG relacionados, sem tratar a varredura
    como prova completa de conformidade.

#### Módulo C --- Testes de interação com IA

-   Biblioteca de cenários e prompts de teste.
-   Casos equivalentes que variam somente o aspecto sob avaliação.
-   Avaliação de estereótipos, linguagem paternalista, pressupostos de
    incapacidade e omissões relevantes.
-   Registro da versão do modelo, parâmetros e data, quando disponíveis.
-   Comparação entre saídas sem transformar diferenças isoladas em prova
    automática de discriminação.

#### Módulo D --- Revisão humana inclusiva

-   Formulários acessíveis para avaliadores.
-   Opção de comentários em texto, áudio ou outros formatos acessíveis.
-   Revisão por mais de uma pessoa em casos de maior impacto.
-   Remuneração e reconhecimento do trabalho de consultoria de
    participantes com deficiência.
-   Canal para contestar classificação, ocultar dados identificáveis e
    solicitar remoção de contribuição.

#### Módulo E --- Gestão de evidências e riscos

Cada achado registra: - identificador e data; - página, tarefa ou
componente; - descrição objetiva da barreira; - passos para
reproduzir; - evidência mínima necessária, com dados sensíveis
removidos; - critério técnico ou princípio relacionado; - impacto sobre
a tarefa; - confiança da avaliação; - recomendação e responsável pela
correção; - estado: novo, em análise, confirmado, corrigido ou
contestado.

#### Módulo F --- Relatórios e acompanhamento

-   Resumo executivo em linguagem simples.
-   Lista técnica de achados para desenvolvedores.
-   Priorização por severidade, alcance e risco de dano.
-   Exportação em Markdown, CSV ou PDF.
-   Histórico de correções e comparação entre versões.
-   Painel com tendências, sem expor informações pessoais dos
    participantes.

## 8. Arquitetura técnica sugerida

Uma arquitetura modular permite começar pequeno e evoluir sem depender
de um modelo proprietário.

  -----------------------------------------------------------------------
  Camada                  Tecnologia inicial      Função
                          sugerida                
  ----------------------- ----------------------- -----------------------
  Interface web           React ou Next.js +      Painel acessível,
                          TypeScript              cadastro e relatórios

  API                     Node.js + Express ou    Regras de negócio,
                          NestJS                  autenticação e
                                                  orquestração

  Banco de dados          PostgreSQL              Projetos, testes,
                                                  achados e histórico

  Execução de testes      Playwright              Automação de fluxos e
                                                  navegação

  Auditoria automatizada  axe-core integrado aos  Identificação de
                          testes                  problemas comuns de
                                                  acessibilidade

  Verificação manual      Checklist WCAG 2.2 +    Critérios que exigem
  guiada                  roteiros de teste       julgamento humano

  Avaliação de IA         Adaptador opcional para Executar cenários e
                          APIs de modelos         armazenar resultados
                                                  minimizados

  Autenticação            Sessões seguras ou      Controle de acesso por
                          provedor confiável      função

  Implantação             Docker e CI/CD          Reprodutibilidade e
                                                  testes a cada versão

  Observabilidade         Logs estruturados e     Diagnóstico técnico e
                          métricas sem conteúdo   monitoramento
                          sensível                
  -----------------------------------------------------------------------

**Recomendação:** começar com um protótipo web e um banco relacional.
Não é necessário treinar um modelo de IA próprio na primeira fase. O
maior valor inicial está em uma metodologia clara, casos de teste bem
definidos e participação efetiva das pessoas afetadas.

### 8.1 Entidades de dados mínimas

-   `audits`: auditoria, sistema, escopo, responsável e versão.
-   `test_scenarios`: tarefa, condição de teste e critério.
-   `test_runs`: execução, data, configuração e resultado.
-   `findings`: barreira identificada, severidade, evidência e estado.
-   `recommendations`: ação sugerida, responsável e prazo.
-   `reviews`: avaliação humana, justificativa e nível de confiança.
-   `accessibility_profiles`: necessidades de interação usadas para
    planejar testes, sem armazenar diagnóstico identificável quando não
    for necessário.
-   `change_log`: histórico de alterações e correções.

Dados de participantes devem ficar separados dos resultados técnicos
sempre que possível. Use identificadores pseudônimos, controle de acesso
e prazo de retenção definido.

## 9. Metodologia de auditoria

### Etapa 1 --- Preparação

-   Definir a pergunta e a tarefa que será auditada.
-   Confirmar autorização para testar o sistema.
-   Identificar os grupos e modos de interação relevantes.
-   Definir quais dados serão coletados e por quanto tempo.
-   Publicar protocolo e critérios antes dos testes.

### Etapa 2 --- Testes automatizados

-   Executar varredura de acessibilidade.
-   Automatizar fluxos críticos com Playwright.
-   Registrar erros, passos de reprodução e versões.
-   Não interpretar ausência de alertas como garantia de acessibilidade.

### Etapa 3 --- Testes manuais

-   Navegar somente com teclado.
-   Testar com leitores de tela e ampliação de conteúdo.
-   Verificar legendas, transcrições, foco, mensagens de erro e tempo
    limite.
-   Avaliar linguagem simples, previsibilidade e consistência.
-   Incluir dispositivos e tecnologias assistivas relevantes ao público
    do sistema.

### Etapa 4 --- Testes comparativos de IA

-   Criar pares de prompts ou entradas equivalentes.
-   Alterar apenas uma variável por vez quando isso for
    metodologicamente adequado.
-   Repetir cada cenário, pois modelos podem variar suas respostas.
-   Registrar versão, data, parâmetros e critérios.
-   Usar rubricas definidas previamente e revisão humana; não depender
    somente de outro modelo para julgar o resultado.

### Etapa 5 --- Validação participativa

-   Convidar participantes com perfis diversos, sem presumir que uma
    pessoa representa todo um grupo.
-   Oferecer consentimento acessível e possibilidade de desistência.
-   Remunerar o trabalho de avaliação.
-   Evitar exigir laudos médicos quando eles não forem necessários.
-   Não pedir relatos íntimos ou dados de saúde além do indispensável.

### Etapa 6 --- Priorização e correção

-   Classificar impacto funcional, número de tarefas afetadas,
    frequência e confiança da evidência.
-   Distinguir falha técnica, barreira de conteúdo, problema de processo
    e possível discriminação.
-   Definir responsável, prazo e teste de regressão.
-   Reexecutar o cenário após a correção.

## 10. Indicadores de sucesso

Os indicadores devem medir resultados e qualidade do processo, não
apenas quantidade de testes.

  -----------------------------------------------------------------------
  Indicador               Definição               Meta inicial sugerida
  ----------------------- ----------------------- -----------------------
  Cobertura de tarefas    Tarefas prioritárias    ≥ 80% no piloto
  críticas                auditadas ÷ tarefas     
                          mapeadas                

  Achados reproduzíveis   Achados com passos e    ≥ 90%
                          evidências suficientes  
                          ÷ total de achados      

  Correções verificadas   Achados corrigidos e    ≥ 80% no piloto
                          retestados ÷ achados    
                          confirmados             
                          selecionados            

  Regressões              Problemas corrigidos    Tendência decrescente
                          que reaparecem em nova  
                          versão                  

  Barreiras críticas      Quantidade de bloqueios Zero antes de liberar o
  abertas                 em tarefas essenciais   fluxo auditado, quando
                                                  viável

  Participação inclusiva  Etapas do projeto com   Desde a descoberta até
                          participação real de    a validação
                          PCDs                    

  Usabilidade percebida   Avaliação qualitativa   Melhorar entre ciclos
                          de autonomia, esforço e 
                          compreensão             

  Privacidade             Incidentes ou coleta    Zero incidentes
                          fora da finalidade      conhecidos
  -----------------------------------------------------------------------

Essas metas são hipóteses de planejamento e devem ser ajustadas após o
piloto. Não se deve usar um único "índice de capacitismo" como selo
definitivo: uma média pode esconder uma barreira grave para um grupo
específico.

## 11. Modelo de classificação de achados

-   **Crítico:** impede acesso a serviço essencial ou bloqueia
    completamente uma tarefa importante sem alternativa acessível.
-   **Alto:** torna uma tarefa importante muito difícil, insegura ou
    dependente de ajuda de terceiros.
-   **Moderado:** causa dificuldade relevante, retrabalho ou perda de
    informação, mas existe alternativa funcional.
-   **Baixo:** problema localizado com impacto limitado, sem deixar de
    merecer correção.

A severidade deve considerar contexto, frequência, alternativas
disponíveis e impacto sobre a autonomia. Uma barreira pode ser crítica
mesmo que afete poucas pessoas, caso impeça o acesso a um direito ou
serviço essencial.

## 12. Plano de desenvolvimento por fases

### Fase 0 --- Descoberta e governança (semanas 1--2)

**Entregáveis:** problema delimitado, mapa de usuários, riscos,
autorização de testes, protocolo de participação e critérios de sucesso.

### Fase 1 --- Pesquisa e desenho (semanas 3--4)

**Entregáveis:** revisão bibliográfica, personas baseadas em pesquisa
(não estereótipos), jornadas, protótipo navegável e matriz WCAG
aplicável.

### Fase 2 --- MVP de auditoria web (semanas 5--8)

**Entregáveis:** cadastro de auditorias, execução de testes
Playwright/axe-core, registro de achados e exportação Markdown/CSV.

### Fase 3 --- Avaliação de IA (semanas 9--11)

**Entregáveis:** biblioteca de cenários, registro de versões, avaliação
com rubrica e comparação de saídas.

### Fase 4 --- Validação participativa (semanas 12--14)

**Entregáveis:** sessões de teste acessíveis, análise de problemas,
priorização e plano de correção.

### Fase 5 --- Piloto e publicação (semanas 15--16)

**Entregáveis:** relatório final, demonstração, documentação técnica,
limitações conhecidas e roadmap.

O cronograma é uma estimativa para uma equipe pequena e pode mudar
conforme disponibilidade de participantes, escopo e exigências éticas.

## 13. Equipe e responsabilidades

-   **Coordenação de pesquisa:** pergunta, método, bibliografia e
    relatório.
-   **Desenvolvimento front-end:** interface acessível e experiência do
    usuário.
-   **Desenvolvimento back-end:** API, dados, autenticação e relatórios.
-   **Qualidade/acessibilidade:** automação, testes manuais e critérios
    WCAG.
-   **Especialista em IA/dados:** desenho dos cenários e análise de
    resultados.
-   **Consultores com deficiência:** identificação de barreiras,
    validação e priorização, com participação remunerada.
-   **Orientação ética/jurídica, quando necessário:** consentimento,
    LGPD, contratos e limites de uso.

Em um projeto estudantil, uma pessoa pode assumir mais de uma função,
mas a participação de pessoas com deficiência não deve ser substituída
apenas por simulações feitas pela equipe.

## 14. Privacidade, segurança e ética

1.  **LGPD:** mapear finalidade, base legal, necessidade, acesso,
    retenção e descarte dos dados. Dados de saúde são dados pessoais
    sensíveis; evite coletá-los se não forem necessários.
2.  **Consentimento acessível:** explicar objetivos, riscos, uso de
    gravações e direito de desistir em linguagem e formatos acessíveis.
3.  **Minimização:** guardar apenas evidências necessárias; borrar
    nomes, rostos, vozes e identificadores quando possível.
4.  **Segurança:** controle de acesso, criptografia em trânsito e em
    repouso quando aplicável, cópias de segurança e registro de acesso.
5.  **Sem inferência de diagnóstico:** não deduzir deficiência por
    comportamento, aparência, voz ou resultados.
6.  **Sem decisões automáticas de alto impacto:** a plataforma não deve
    aprovar ou reprovar pessoas.
7.  **Transparência:** documentar falsos positivos, falsos negativos,
    limitações e incertezas.
8.  **Acessibilidade do estudo:** materiais, convites, formulários e
    sessões devem ser acessíveis.
9.  **Revisão ética:** verificar com a instituição se a pesquisa com
    participantes exige apreciação ética formal.
10. **Divulgação responsável:** dar oportunidade para responsáveis
    corrigirem falhas antes da publicação de detalhes que possam criar
    risco de segurança, sem permitir que isso silencie resultados
    legítimos.

Este documento não substitui assessoria jurídica ou avaliação formal de
ética em pesquisa.

## 15. Riscos do próprio projeto e mitigação

  -----------------------------------------------------------------------
  Risco                               Mitigação
  ----------------------------------- -----------------------------------
  Automatizar o julgamento do que é   Usar automação como triagem; manter
  capacitista                         revisão humana e contestação

  Tratar PCDs como grupo homogêneo    Incluir diferentes experiências e
                                      registrar limites de
                                      representatividade

  Coletar dados sensíveis excessivos  Minimização, pseudonimização e
                                      prazos de descarte

  Produzir um ranking simplista de    Publicar metodologia, contexto,
  empresas                            incertezas e direito de resposta

  Falsos positivos ou negativos       Testes repetidos, validação manual
                                      e análise de casos

  Dependência de uma API proprietária Adaptadores substituíveis e
                                      funcionamento básico sem IA externa

  Interface da ferramenta ser         Testar a própria plataforma com
  inacessível                         critérios WCAG e usuários

  Usar participantes sem remuneração  Orçamento de participação e
  ou influência real                  registro de decisões tomadas a
                                      partir do feedback

  Corrigir apenas sintomas            Investigar dados, requisitos,
  superficiais                        processos e incentivos
                                      organizacionais
  -----------------------------------------------------------------------

## 16. Entregáveis do projeto

1.  Dossiê de pesquisa e revisão bibliográfica.
2.  Taxonomia de riscos de capacitismo algorítmico.
3.  Matriz de testes baseada em WCAG 2.2 e cenários específicos de IA.
4.  Protótipo navegável da plataforma.
5.  API e banco de dados mínimos.
6.  Biblioteca documentada de cenários de auditoria.
7.  Relatório de resultados do piloto.
8.  Guia de boas práticas para equipes de desenvolvimento.
9.  Plano de manutenção, monitoramento e correção.
10. Apresentação com demonstração e limitações explícitas.

## 17. Critérios para escolher um piloto

Escolha um sistema pequeno, com autorização e tarefas observáveis. Boas
opções:

-   portal institucional de informação;
-   formulário de inscrição em evento;
-   chatbot de perguntas frequentes;
-   página de serviço público em ambiente de homologação;
-   ferramenta educacional que não tome decisões de alto impacto.

Evite começar por recrutamento, concessão de benefícios ou decisões
clínicas: são contextos de maior risco e exigem governança, competência
técnica e avaliação jurídica mais robustas.

## 18. Estado da arte e referências iniciais

As referências abaixo oferecem fundamentos legais, técnicos e
acadêmicos. A lista é um ponto de partida; para um trabalho formal,
consulte o texto completo, registre a data de acesso e amplie a revisão
com bases acadêmicas.

1.  **Brasil. Lei nº 13.146, de 6 de julho de 2015 --- Lei Brasileira de
    Inclusão da Pessoa com Deficiência.** Inclui definições de barreiras
    e disposições sobre desenho universal, ciência, tecnologia e
    acessibilidade.\
    https://www.planalto.gov.br/ccivil_03/\_ato2015-2018/2015/lei/l13146.htm

2.  **W3C. Web Content Accessibility Guidelines (WCAG) 2.2.**
    Recomendação técnica para acessibilidade de conteúdo web. Deve ser
    combinada com testes manuais e participação de usuários.\
    https://www.w3.org/TR/WCAG22/

3.  **UNESCO. Recomendação sobre a Ética da Inteligência Artificial
    (2021).** Aborda direitos humanos, transparência, inclusão,
    avaliação de impacto e riscos de discriminação.\
    https://unesdoc.unesco.org/ark:/48223/pf0000381137_por

4.  **Silva, André; Martins, Elaíde. "Capacitismo algorítmico no
    ChatGPT: uma nova modalidade de discriminação contra as pessoas com
    deficiência".** Artigo acadêmico que discute a relação entre IA,
    vieses algorítmicos e capacitismo.\
    https://revista.fumec.br/index.php/mediacao/article/view/10790

5.  **Magnolo, Talita Souza; Novaes, Daniele da Silva Garcez.
    "Representações algorítmicas da deficiência: uma análise de imagens
    geradas por Inteligência Artificial".** Pesquisa sobre
    representação, invisibilização e estereótipos em imagens geradas por
    IA.\
    https://revistas.uece.br/index.php/linguagememfoco/article/view/16013

6.  **Guimarães, Luíza Resende. "Inteligência artificial e enviesamento
    algorítmico: novas formas de discriminação contra pessoas com
    deficiência".** Discussão jurídica sobre discriminação algorítmica,
    direitos e estratégias de enfrentamento.\
    https://civilistica.emnuvens.com.br/redc/article/view/973

7.  **Oliveira, André Campos B.; Aguiar, Josirene Aparecida M.; Reis,
    Yuri O. de Morais Teixeira dos; Ribeiro, Júlia Gonçalves.
    "Tecnologia assistiva e capacitismo estrutural: uma análise
    sociotécnica da inclusão de pessoas com deficiência".** Trabalho
    recente sobre tecnologia assistiva, acessibilidade digital e desenho
    universal.\
    https://publicacoes.unifimes.edu.br/index.php/coloquio/pt_BR/article/view/6837

### Referenciais técnicos adicionais para investigar

-   **axe-core:** biblioteca de testes automatizados de acessibilidade.
    https://github.com/dequelabs/axe-core
-   **Playwright:** automação de testes de aplicações web.
    https://playwright.dev/
-   **W3C WAI --- visão geral das WCAG:**
    https://www.w3.org/WAI/standards-guidelines/wcag/
-   **Lei nº 13.709/2018 --- Lei Geral de Proteção de Dados Pessoais
    (LGPD):** consultar o texto oficial e a orientação atualizada da
    ANPD para o contexto de tratamento de dados.

## 19. Próximas decisões

Antes de começar a implementação, a equipe deve decidir:

-   [ ] O projeto será uma pesquisa acadêmica, um protótipo de portfólio
    ou uma solução para uso real?
-   [ ] Qual será o primeiro sistema ou serviço auditado?
-   [ ] Quem autorizará os testes?
-   [ ] Quais perfis de deficiência e tecnologias assistivas serão
    considerados no piloto?
-   [ ] Como serão recrutados, remunerados e protegidos os
    participantes?
-   [ ] Quais critérios serão usados para classificar achados?
-   [ ] Quais dados serão guardados, por quanto tempo e por quem?
-   [ ] Qual é a definição de sucesso para o primeiro ciclo?

## 20. Conclusão

O capacitismo algorítmico deve ser tratado como um problema
sociotécnico: não está apenas no código, mas também nos dados, nas metas
de produto, nos processos de decisão, na acessibilidade das interfaces e
em quem participa do desenvolvimento. Uma ferramenta de auditoria pode
ajudar a transformar preocupações gerais em evidências reproduzíveis e
correções verificáveis, desde que não se apresente como árbitro absoluto
da experiência de pessoas com deficiência.

A proposta da Incluvia é começar por uma auditoria pequena e autorizada,
unir automação com avaliação humana, incluir pessoas com deficiência com
poder real de participação e manter um ciclo de correção contínua. O
sucesso não será simplesmente detectar mais problemas, mas reduzir
barreiras concretas e ampliar acesso, autonomia e participação em
igualdade de condições.
