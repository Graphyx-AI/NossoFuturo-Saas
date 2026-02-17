import ProspeccaoClient from './ProspeccaoClient';

export default function ProspeccaoPage({ params }) {
  return <ProspeccaoClient nicho={params?.nicho} />;
}
