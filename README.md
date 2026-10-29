# Relatório de Plantão — Grupo SERVNAC

Link para os supervisores de plantão preencherem o relatório. O site monta o texto no mesmo modelo do relatório manual (viatura, horários, rondas, ocorrências, efetivo e considerações finais), grava numa planilha Google e abre o WhatsApp com o texto pronto.

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html` | O site (GitHub Pages). |
| `apps-script/Code.gs` | Script que grava na planilha. Fica aqui só como cópia: ele roda no Google Apps Script. |

## Ligar à planilha (Google)

1. Crie uma planilha nova no Google Sheets, por exemplo "Relatórios de Plantão".
2. Menu **Extensões → Apps Script**. Apague o conteúdo de `Código.gs` e cole todo o `apps-script/Code.gs`. Salve.
3. No seletor de funções escolha **setup** e clique em **Executar**. Autorize o acesso. Será criada a aba **Relatorios**.
4. **Implantar → Nova implantação** → tipo **App da Web**, executar como **Eu**, acesso **Qualquer pessoa** → **Implantar**.
5. Copie a URL que termina em `/exec` e cole no `index.html`, nesta linha perto do início:
   ```js
   window.API_URL="COLE_AQUI_A_URL_DO_APPS_SCRIPT";
   ```

Sem a URL o site já funciona para copiar e mandar no WhatsApp, só não grava na planilha.

## O que o site faz

- Calcula o KM percorrido e lembra, no aparelho, o supervisor, a VTR, a placa e o último KM final de cada placa (vira o KM inicial do próximo plantão).
- Salva o rascunho no aparelho enquanto o supervisor preenche.
- Escreve as considerações finais automaticamente (postos, km, faltas, ocorrências, sincronização e encerramento); o supervisor só descreve os fatos relevantes.
- Aba **Relatórios enviados**: lista da planilha com filtro por supervisor e período, totais, texto completo e download em CSV.

Mudou o `Code.gs`? Publique de novo em **Implantar → Gerenciar implantações → editar → Nova versão**. A URL continua a mesma.
