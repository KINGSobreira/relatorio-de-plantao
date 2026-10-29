# Relatório de Plantão — Grupo SERVNAC

Link para os supervisores de plantão preencherem o relatório. O site gera um **PDF** no modelo do relatório manual (viatura, horários, rondas, ocorrências, efetivo e considerações finais) com as **fotos da viatura** tiradas pela câmera do celular, envia o PDF pelo WhatsApp e grava o relatório numa planilha Google (o PDF fica numa pasta do Google Drive).

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html` | O site (GitHub Pages). |
| `apps-script/Code.gs` | Script que grava na planilha. Fica aqui só como cópia: ele roda no Google Apps Script. |

## Ligar à planilha (Google)

1. Crie uma planilha nova no Google Sheets, por exemplo "Relatórios de Plantão".
2. Menu **Extensões → Apps Script**. Apague o conteúdo de `Código.gs` e cole todo o `apps-script/Code.gs`. Salve.
3. No seletor de funções escolha **setup** e clique em **Executar**. Autorize o acesso (planilha e Drive). Serão criadas a aba **Relatorios** e, no seu Drive, a pasta **Relatórios de Plantão - PDFs**, onde ficam os PDFs. A coluna **PDF** da planilha traz o link de cada um.
4. **Implantar → Nova implantação** → tipo **App da Web**, executar como **Eu**, acesso **Qualquer pessoa** → **Implantar**.
5. Copie a URL que termina em `/exec` e cole no `index.html`, nesta linha perto do início:
   ```js
   window.API_URL="COLE_AQUI_A_URL_DO_APPS_SCRIPT";
   ```

Sem a URL o site já gera o PDF e manda no WhatsApp, só não grava na planilha.

## O que o site faz

- Calcula o KM percorrido e lembra, no aparelho, o supervisor, a VTR, a placa e o último KM final de cada placa (vira o KM inicial do próximo plantão).
- Fotos da viatura: botão **Tirar foto** (abre a câmera traseira) ou **Escolher da galeria**. Cada foto ganha carimbo de data e hora, legenda (Frente, Painel / odômetro, Avaria…) e é reduzida para o PDF não ficar pesado.
- **Gerar PDF e enviar**: monta o PDF com logo, quadros, considerações, assinatura e registro fotográfico. No celular, **Enviar PDF no WhatsApp** abre o compartilhamento do aparelho com o arquivo; no computador, o PDF é baixado para anexar.
- Salva o rascunho e as fotos no aparelho enquanto o supervisor preenche (não se perde se fechar a página).
- Escreve as considerações finais automaticamente (postos, km, faltas, ocorrências, sincronização e encerramento); o supervisor só descreve os fatos relevantes.
- Aba **Relatórios enviados**: lista da planilha com filtro por supervisor e período, totais, relatório completo, link do PDF e download em CSV.

Mudou o `Code.gs`? Publique de novo em **Implantar → Gerenciar implantações → editar → Nova versão**. A URL continua a mesma.
