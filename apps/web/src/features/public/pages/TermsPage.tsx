import { LandingSection } from '../components/landing/LandingSection';

const SECTIONS = [
  {
    title: '1. Acceptation des conditions',
    content:
      "En accédant à Publista ou en l'utilisant, vous acceptez d'être lié par les présentes Conditions Générales d'Utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser le service.",
  },
  {
    title: '2. Description du service',
    content:
      "Publista est une plateforme SaaS de création de contenu multi-plateforme propulsée par l'intelligence artificielle. Le service permet la création de Reels, Carousels, Posts, ainsi que leur publication sur les réseaux sociaux.",
  },
  {
    title: '3. Inscription et comptes',
    content:
      "Vous devez fournir des informations exactes lors de l'inscription. Vous êtes responsable de la sécurité de votre compte et de votre mot de passe. Publista ne peut être tenu responsable de toute perte résultant d'un accès non autorisé à votre compte.",
  },
  {
    title: '4. Utilisation acceptable',
    content:
      "Vous vous engagez à ne pas utiliser le service pour : (a) créer du contenu illégal, diffamatoire ou portant atteinte aux droits de tiers, (b) tenter de contourner les limitations du service, (c) utiliser le service d'une manière susceptible de compromettre sa sécurité ou son fonctionnement.",
  },
  {
    title: '5. Propriété intellectuelle',
    content:
      "Vous conservez tous les droits sur le contenu que vous créez à l'aide de Publista. Publista conserve la propriété de la plateforme, de sa technologie et de ses modèles IA. Le contenu généré par l'IA est soumis aux conditions d'utilisation de nos fournisseurs IA.",
  },
  {
    title: '6. Abonnements et facturation',
    content:
      "Les plans payants sont facturés mensuellement ou annuellement selon votre choix. Vous pouvez annuler votre abonnement à tout moment depuis vos paramètres. Les remboursements sont disponibles dans les 14 jours suivant un paiement.",
  },
  {
    title: '7. Watermark',
    content:
      "Le plan gratuit inclut un watermark \"Made with Publista\" sur le contenu exporté. Les plans payants retirent ce watermark. La suppression ou modification du watermark sur le plan gratuit constitue une violation des présentes conditions.",
  },
  {
    title: '8. Protection des données',
    content:
      "Publista est conforme au RGPD. Vos données personnelles sont chiffrées et stockées de manière sécurisée. Vous pouvez demander la suppression de vos données à tout moment. Consultez notre Politique de Confidentialité pour plus de détails.",
  },
  {
    title: '9. Limitation de responsabilité',
    content:
      "Publista est fourni \"tel quel\" sans garantie d'aucune sorte. Nous ne garantissons pas que le service sera ininterrompu ou exempt d'erreurs. Notre responsabilité totale est limitée au montant que vous avez payé au cours des 12 derniers mois.",
  },
  {
    title: '10. Modifications des conditions',
    content:
      "Publista se réserve le droit de modifier ces conditions à tout moment. Les modifications seront notifiées par email ou via le service. Votre utilisation continue du service après notification constitue une acceptation des nouvelles conditions.",
  },
  {
    title: '11. Résiliation',
    content:
      "Publista peut résilier ou suspendre votre compte immédiatement, sans préavis, en cas de violation de ces conditions. Vous pouvez résilier votre compte à tout moment depuis vos paramètres.",
  },
  {
    title: '12. Droit applicable',
    content:
      "Les présentes conditions sont régies par le droit français. Tout litige sera soumis à la compétence exclusive des tribunaux de Paris, France.",
  },
];

export function TermsPage() {
  return (
    <LandingSection className="pt-24 md:pt-32">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-3xl font-bold text-pub-text md:text-4xl">
          Conditions Générales d'Utilisation
        </h1>
        <p className="mb-10 text-sm text-pub-text-muted">
          Dernière mise à jour : février 2026
        </p>

        <div className="space-y-8">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h2 className="mb-3 text-lg font-semibold text-pub-text">
                {s.title}
              </h2>
              <p className="leading-relaxed text-pub-text-secondary">
                {s.content}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-12 text-sm text-pub-text-muted">
          Pour toute question concernant ces conditions, contactez-nous à{' '}
          <a href="mailto:legal@publista.com" className="text-pub-accent hover:text-pub-accent-hover">
            legal@publista.com
          </a>
          .
        </p>
      </div>
    </LandingSection>
  );
}
