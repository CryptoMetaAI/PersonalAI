import { Default } from 'components/layouts/Default';
import { KolList } from 'components/templates/vip/kol';
import type { NextPage } from 'next';

const KolListPage: NextPage = () => {
  return (
    <Default pageName="Home">
      <KolList />
    </Default>
  );
};

export default KolListPage;
