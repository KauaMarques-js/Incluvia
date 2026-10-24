'use client';

import { api } from '@/lib/api-client';
import { useResource } from '@/lib/use-resource';
import { plural } from '@/lib/labels';
import { PageHeader } from '@/components/PageHeader';
import { ImpactBadge } from '@/components/Badges';
import { ErrorState, LoadingState } from '@/components/States';

/** Biblioteca de cenários e regras usada pelas avaliações de IA. */
export default function AiLibraryPage() {
  const { data, error, loading } = useResource(() => api.getAiCatalog(), []);

  const header = (
    <PageHeader
      title="Biblioteca de cenários e regras"
      breadcrumbs={[{ label: 'Projetos', href: '/projects' }, { label: 'Biblioteca de IA' }]}
      description="Os cenários definem as perguntas de teste; as regras definem o que a rubrica procura. Ambos devem ser validados com consultores com deficiência antes do uso em produção."
    />
  );

  if (loading) {
    return (
      <>
        {header}
        <LoadingState label="Carregando biblioteca…" />
      </>
    );
  }
  if (error || !data) return <ErrorState error={error} resource="Biblioteca" />;

  return (
    <>
      {header}

      <section aria-labelledby="scenarios-title">
        <div className="section-header">
          <div>
            <h2 id="scenarios-title">Cenários ({data.scenarios.length})</h2>
            <p>
              Cenários pareados mudam só a menção à deficiência entre as duas perguntas. Os de decisão também comparam o
              desfecho (favorável ou desfavorável).
            </p>
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <caption className="sr-only">Cenários de teste</caption>
            <thead>
              <tr>
                <th scope="col">Cenário</th>
                <th scope="col">Contexto</th>
                <th scope="col">Deficiência</th>
                <th scope="col">Método</th>
                <th scope="col">Validação</th>
              </tr>
            </thead>
            <tbody>
              {data.scenarios.map((scenario) => (
                <tr key={scenario.id}>
                  <td>
                    <strong>{scenario.title}</strong>
                    <p className="cell-note">{scenario.hypothesis}</p>
                    {scenario.intersectional && <p className="cell-note">Interseccional: {scenario.intersectional}</p>}
                  </td>
                  <td>{scenario.context}</td>
                  <td>{scenario.disabilities.join(', ') || '—'}</td>
                  <td className="nowrap">
                    {scenario.referencePrompt === null ? 'Pergunta única' : 'Pareado'}
                    {scenario.decision && (
                      <>
                        <br />
                        <span className="muted">compara desfecho</span>
                      </>
                    )}
                  </td>
                  <td>{scenario.validation === 'validated' ? 'Validado com consultores PCD' : 'Pendente com consultores PCD'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section" aria-labelledby="rules-title">
        <div className="section-header">
          <div>
            <h2 id="rules-title">Regras da rubrica ({data.rules.length})</h2>
            <p>O histórico vem das suas revisões: cada achado confirmado ou descartado mede a precisão da regra.</p>
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <caption className="sr-only">Regras da rubrica de capacitismo</caption>
            <thead>
              <tr>
                <th scope="col">Regra</th>
                <th scope="col">Severidade</th>
                <th scope="col">Como corrigir</th>
                <th scope="col">Histórico de revisão</th>
              </tr>
            </thead>
            <tbody>
              {data.rules.map((rule) => (
                <tr key={rule.ruleId}>
                  <td>
                    <strong>{rule.title}</strong>
                    <p className="cell-note">{rule.description}</p>
                  </td>
                  <td>
                    <ImpactBadge impact={rule.impact} />
                  </td>
                  <td>
                    <p className="small">{rule.rewrite}</p>
                  </td>
                  <td className="nowrap">
                    {rule.stats && rule.stats.decided > 0 ? (
                      <>
                        Confirmada em {rule.stats.confirmed} de {plural(rule.stats.decided, 'revisão', 'revisões')}
                        <br />
                        <span className="muted">{plural(rule.stats.falsePositive, 'falso positivo', 'falsos positivos')}</span>
                      </>
                    ) : (
                      <span className="muted">Sem revisões</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
