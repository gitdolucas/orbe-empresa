# Empresa — direção visual

## Fonte

Referência: https://cara-certa.com.br · captura em 11/11/2026.
Evidências: branding/images via Firecrawl, captura de navegador e estilos computados.

![Referência Cara Certa](.firecrawl/cara-certa-reference.png)

## Resumo

Visual editorial claro: tipografia grande, espaço em branco, poucos elementos, hierarquia direta. Adaptar a linguagem visual para uma consulta empresarial; identidade e conteúdo próprios do Empresa.

## Tokens observados

- Fundo: `#F7F7F4`; superfícies brancas.
- Texto: `#1D1E1B`.
- Acento lima: `#DFFF4F`; secundário terracota: `#D44117`.
- Fonte principal real, verificada via CSS: **Schibsted Grotesk**, variável 400–900. O rótulo “Mono” do extrator não corresponde ao texto principal.
- Fonte de metadados: Geist Mono.
- H1 observado: aproximadamente 72px, peso 500, altura 1, tracking -0.065em.
- Botões: raio 10px, sem sombra, variantes lima/preto e contorno.
- Textura: pontos muito discretos; divisórias finas.

## Layout adaptado

- Cabeçalho horizontal, marca e até três links. Sem navegação lateral.
- Container de até 1200px; margens amplas e hero em duas colunas no desktop.
- Início: um título, uma explicação curta, uma busca por CNPJ, exemplos em links discretos.
- Nenhuma empresa pré-carregada na home. Resultado apenas após consulta/seleção explícita.
- Perfil: busca compacta, identidade e uma aba por vez. Campos adicionais em expansão.
- Após os exemplos, um diagrama SVG explicativo conecta cadastro, evidências e coletas a um perfil e às perguntas que ele ajuda a responder. Sem dados reais pré-carregados. Loop discreto, pausa explícita e versão estática para movimento reduzido; fluxo horizontal no desktop e vertical no mobile.
- Sem banners de integração, métricas ou blocos promocionais na home.
- Mobile: coluna única, menu compacto, busca e ação com largura total.
- JSON e detalhes técnicos ficam em abas/expansões ou documentação.

## Componentes

Campos brancos, bordas neutras, foco preto/lima. Cards com borda sutil e pouco preenchimento visual. Status verdes discretos. Rodapé mínimo. Sem gradientes, brilhos ou grandes grupos de badges.

## Implementação

Next.js/React existente. Fontes auto-hospedadas via Fontsource (distribuição open source), sem copiar assets ou logotipo de terceiros. Backend e proveniência preservados. Respeitar prefers-reduced-motion.
