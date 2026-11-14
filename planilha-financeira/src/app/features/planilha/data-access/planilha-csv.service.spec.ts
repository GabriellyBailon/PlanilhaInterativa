import { PlanilhaCsvService } from './planilha-csv.service';

describe('Importação e exportação de planilhas CSV', () => {
  let service: PlanilhaCsvService;

  beforeEach(() => {
    service = new PlanilhaCsvService();
  });

  it('importa registros de um CSV simples e os separa por categoria', () => {
    const csv = [
      'Area;Descricao;Valor;DataAlteracao',
      'Entradas;Salário;R$ 200,00;15/10/2026 09:30:45',
      'Saídas;Aluguel;R$ 50,00;16/10/2026 10:00:00',
      'Economias;Reserva;R$ 25,00;17/10/2026 11:15:00',
    ].join('\n');

    const resultado = service.importarCsvTexto(csv, 10);

    expect(resultado.entradas).toEqual([
      {
        id: 10,
        descricao: 'Salário',
        valor: 200,
        criadoEm: new Date(2026, 9, 15, 9, 30, 45).toISOString(),
      },
    ]);
    expect(resultado.saidas[0].descricao).toBe('Aluguel');
    expect(resultado.economias[0].descricao).toBe('Reserva');
    expect(resultado.nextId).toBe(13);
  });

  it('preserva o nome da planilha ao exportar e importar o formato agrupado', () => {
    const nomePagina = 'Meu "orçamento"';
    const csv = service.gerarCsv({
      nomePagina,
      entradas: [
        {
          id: 1,
          descricao: 'Salário',
          valor: 200,
          criadoEm: '2026-10-15T12:30:45.000Z',
        },
      ],
      saidas: [],
      economias: [],
    });

    const resultado = service.importarCsvTexto(csv, 10);

    expect(resultado.nomePagina).toBe(nomePagina);
  });

  it('protege descrições semelhantes a fórmulas e as restaura na importação', () => {
    const descricoes = ['=1+1', "'=1+1", 'Descrição comum'];
    const csv = service.gerarCsv({
      nomePagina: 'Orçamento',
      entradas: descricoes.map((descricao, indice) => ({
        id: indice + 1,
        descricao,
        valor: 10,
        criadoEm: '2026-10-15T12:30:45.000Z',
      })),
      saidas: [],
      economias: [],
    });

    expect(csv).toContain(";'=1+1;");
    expect(csv).toContain(";''=1+1;");
    expect(
      service.importarCsvTexto(csv, 10).entradas.map((entrada) => entrada.descricao),
    ).toEqual(descricoes);
  });

  it('rejeita datas inexistentes sem rejeitar dias válidos de ano bissexto', () => {
    for (const data of ['31/02/2026', '29/02/2025', '2026-02-31', '2025-02-29']) {
      const csv = [
        'Area;Descricao;Valor;DataAlteracao',
        `Entradas;Salário;R$ 200,00;${data}`,
      ].join('\n');

      expect(() => service.importarCsvTexto(csv, 1)).toThrowError(
        'Não foi possível importar os dados. Confira a célula D2 e tente novamente.',
      );
    }

    const csv = [
      'Area;Descricao;Valor;DataAlteracao',
      'Entradas;Salário;R$ 200,00;29/02/2024',
    ].join('\n');

    expect(service.importarCsvTexto(csv, 1).entradas[0].criadoEm).toBe(
      new Date(2024, 1, 29).toISOString(),
    );
  });

  it('indica a célula correspondente quando os dados são inválidos', () => {
    expect(service.formatarErro('A', 1)).toBe(
      'Não foi possível importar os dados. Confira a célula A1 e tente novamente.',
    );
  });

  it('não disponibiliza importação parcial quando uma linha posterior é inválida', () => {
    const csv = [
      'Area;Descricao;Valor;DataAlteracao',
      'Entradas;Salário;R$ 200,00;15/10/2026 09:30:45',
      'Outra;Inválido;R$ 50,00;16/10/2026 10:00:00',
    ].join('\n');

    expect(() => service.importarCsvTexto(csv, 10)).toThrowError(
      'Não foi possível importar os dados. Confira a célula A3 e tente novamente.',
    );
  });

  it('importa CSV com BOM, delimitador vírgula, aspas, CRLF e nomes alternativos de categoria', () => {
    const csv = [
      '\uFEFFArea,Descricao,Valor,DataAlteracao',
      '"Ganhos","Salário, principal","R$ 200,00","15/10/2026 09:30:45"',
      '"Gastos","Conta ""especial""","R$ 50,00","16/10/2026"',
      '"Economias","Reserva","R$ 25,00","17/10/2026"',
      '',
    ].join('\r\n');

    const resultado = service.importarCsvTexto(csv, 7);

    expect(resultado.entradas[0].descricao).toBe('Salário, principal');
    expect(resultado.saidas[0].descricao).toBe('Conta "especial"');
    expect(resultado.economias[0].valor).toBe(25);
    expect(resultado.nextId).toBe(10);
  });

  it('aponta para a célula inválida em cabeçalho, linha, categoria, descrição, valor ou data', () => {
    const casos: Array<{ csv: string; celula: string }> = [
      { csv: '', celula: 'A1' },
      { csv: 'Categoria;Descrição\n', celula: 'A1' },
      { csv: 'Area;Descricao;Valor\n', celula: 'A1' },
      {
        csv: 'Area;Descricao;Valor\nEntradas;Item;R$ 10,00;15/10/2026',
        celula: 'A1',
      },
      { csv: 'Area;Descricao;Valor;DataAlteracao\nEntradas;Curta', celula: 'C2' },
      { csv: 'Area;Descricao;Valor;DataAlteracao\nEntradas;;R$ 10,00;15/10/2026', celula: 'B2' },
      { csv: 'Area;Descricao;Valor;DataAlteracao\nOutra;Item;R$ 10,00;15/10/2026', celula: 'A2' },
      { csv: 'Area;Descricao;Valor;DataAlteracao\nEntradas;Item;;15/10/2026', celula: 'C2' },
      { csv: 'Area;Descricao;Valor;DataAlteracao\nEntradas;Item;R$ 10,00;', celula: 'D2' },
    ];

    for (const caso of casos) {
      expect(() => service.importarCsvTexto(caso.csv, 1)).toThrowError(
        `Não foi possível importar os dados. Confira a célula ${caso.celula} e tente novamente.`,
      );
    }
  });

  it('ignora linhas vazias e preserva descrições CSV com aspas e quebras de linha', () => {
    const csv = [
      'Area;Descricao;Valor;DataAlteracao',
      '',
      'Entradas;"Linha 1',
      'Linha 2";R$ 10,00;15/10/2026',
      ' ; ; ; ',
    ].join('\n');

    const resultado = service.importarCsvTexto(csv, 3);

    expect(resultado.entradas).toHaveSize(1);
    expect(resultado.entradas[0].descricao).toBe('Linha 1\nLinha 2');
  });

  it('exporta campos com aspas e separadores e ignora datas de criação inválidas', () => {
    const csv = service.gerarCsv({
      nomePagina: ' Orçamento "mensal" ',
      entradas: [
        {
          id: 1,
          descricao: 'Item; com "aspas"\ne outra linha',
          valor: 10,
          criadoEm: 'data inválida',
        },
      ],
      saidas: [],
      economias: [],
    });

    expect(csv).toContain('"=""Orçamento """"mensal"""""""');
    expect(csv).toContain('"Item; com ""aspas""\ne outra linha"');
    expect(csv).toContain(';R$ 10,00;;');
  });

  it('protege e restaura descrições iniciadas por caracteres interpretáveis como fórmulas', () => {
    const descricoes = ['+comando', '-valor', '@referência', '  =fórmula'];
    const csv = service.gerarCsv({
      nomePagina: 'Orçamento',
      entradas: descricoes.map((descricao, indice) => ({
        id: indice + 1,
        descricao,
        valor: 1,
        criadoEm: '2026-10-15T12:30:45.000Z',
      })),
      saidas: [],
      economias: [],
    });

    expect(
      service.importarCsvTexto(csv, 10).entradas.map((entrada) => entrada.descricao),
    ).toEqual(descricoes);
  });

  it('indica colunas acima de Z para erros no formato agrupado', () => {
    const cabecalho = Array(32).fill('');
    cabecalho[0] = 'Entradas';
    cabecalho[5] = 'Saídas';
    cabecalho[28] = 'Economias';
    const cabecalhoDados = Array(32).fill('');
    cabecalhoDados[1] = 'Descrição';
    const valores = Array(32).fill('');
    valores[30] = 'R$ 50,00';
    valores[31] = '15/10/2026';

    const csv = [
      'Planilha;;;;;;;;;;',
      cabecalho.join(';'),
      cabecalhoDados.join(';'),
      valores.join(';'),
    ].join('\n');

    expect(() => service.importarCsvTexto(csv, 1)).toThrowError(
      'Não foi possível importar os dados. Confira a célula AC4 e tente novamente.',
    );
  });

  it('aceita datas brasileiras com ano de dois dígitos e rejeita horários inválidos', () => {
    const dataAntiga = service.importarCsvTexto(
      'Area;Descricao;Valor;DataAlteracao\nEntradas;Item;R$ 10,00;31/12/0099',
      1,
    );
    expect(dataAntiga.entradas[0].criadoEm).toContain('0099-12-31');

    expect(() =>
      service.importarCsvTexto(
        'Area;Descricao;Valor;DataAlteracao\nEntradas;Item;R$ 10,00;15/10/2026 24:00',
        1,
      ),
    ).toThrowError(/célula D2/);
  });

  it('importa datas ISO e rejeita textos de data e limites de calendário inválidos', () => {
    const iso = service.importarCsvTexto(
      'Area;Descricao;Valor;DataAlteracao\nEntradas;Item;R$ 10,00;2026-10-15T12:30:45.000Z',
      1,
    );
    expect(iso.entradas[0].criadoEm).toBe('2026-10-15T12:30:45.000Z');

    for (const data of ['não é data', '00/01/2026', '01/00/2026', '00/00/2026']) {
      expect(() =>
        service.importarCsvTexto(
          `Area;Descricao;Valor;DataAlteracao\nEntradas;Item;R$ 10,00;${data}`,
          1,
        ),
      ).toThrowError(/célula D2/);
    }
  });
});
