import { AppelOffre } from '../../../entities'
import { commonDataFields } from './commonDataFields'
import toTypeLiteral from './helpers/toTypeLiteral'

const batiment: AppelOffre = {
  id: 'CRE4 - Bâtiment',
  title:
    '2016/S 174-312851 portant sur la réalisation et l’exploitation d’Installations de production d’électricité à partir de l’énergie solaire « Centrales sur bâtiments, serres et hangars agricoles et ombrières de parking de puissance comprise entre 100 kWc et 8 MWc »',
  shortTitle: 'CRE4 - Bâtiment 2016/S 174-312851',
  launchDate: 'septembre 2016',
  unitePuissance: 'MWc',
  delaiRealisationEnMois: 20,
  delaiRealisationTexte: 'vingt (20) mois',
  paragraphePrixReference: '7',
  paragrapheDelaiDerogatoire: '6.4',
  paragrapheAttestationConformite: '6.6',
  paragrapheEngagementIPFP: '3.2.5',
  afficherParagrapheInstallationMiseEnServiceModification: true,
  renvoiModification: '5.4',
  affichageParagrapheECS: true,
  renvoiDemandeCompleteRaccordement: '6.1',
  renvoiRetraitDesignationGarantieFinancieres: '5.3 et 6.2',
  renvoiEngagementIPFP: '3.2.5 et 7.1.2',
  paragrapheClauseCompetitivite: '2.6',
  tarifOuPrimeRetenue: "le prix de référence T de l'électricité retenu",
  tarifOuPrimeRetenueAlt: 'ce prix de référence',
  afficherValeurEvaluationCarbone: true,
  afficherPhraseRegionImplantation: false,
  dossierSuiviPar: 'aopv.dgec@developpement-durable.gouv.fr',
  renvoiSoumisAuxGarantiesFinancieres: 'doit être au minimum de 42 mois',
  dataFields: [
    ...commonDataFields,
    {
      // This field is mandatory
      field: 'evaluationCarbone',
      type: toTypeLiteral('number'),
      column:
        'Evaluation carbone simplifiée indiquée au C. du formulaire de candidature et arrondie (kg eq CO2/kWc)',
    },
  ],
  periodes: [
    {
      id: '1',
      title: 'première',
    },
    {
      id: '2',
      title: 'deuxième',
    },
    {
      id: '3',
      title: 'troisième',
    },
    {
      id: '4',
      title: 'quatrième',
    },
    {
      id: '5',
      title: 'cinquième',
    },
    {
      id: '6',
      title: 'sixième',
    },
    {
      id: '7',
      title: 'septième',
    },
    {
      id: '8',
      title: 'huitième',
    },
    {
      id: '9',
      title: 'neuvième',
    },
    {
      id: '10',
      title: 'dixième',
      isNotifiedOnPotentiel: true,
      noteThresholdByFamily: [
        { familleId: '1', noteThreshold: 27.91 },
        { familleId: '2', noteThreshold: 25.62 },
      ],
      certificateTemplate: 'v0',
    },
    {
      id: '11',
      title: 'onzième',
      isNotifiedOnPotentiel: true,
      noteThresholdByFamily: [
        { familleId: '1', noteThreshold: 0 },
        { familleId: '2', noteThreshold: 0 },
      ],
      certificateTemplate: 'v1',
    },
  ],
  familles: [
    {
      id: '1',
      title: '1. 100 kWc – 500 Mwc',
    },
    {
      id: '2',
      title: '2. 500 kWc – 8 MWc',
      garantieFinanciereEnMois: 36,
      soumisAuxGarantiesFinancieres: true,
    },
  ],
}

export { batiment }
