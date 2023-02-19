import { Default } from 'components/layouts/Default';
import { LensVIP } from 'components/templates/vip/lensVip';
import type { NextPage } from 'next';

const LensVipPage: NextPage = () => {
  return (
    <Default pageName="Home">
      <LensVIP />
    </Default>
  );
};

export default LensVipPage;
