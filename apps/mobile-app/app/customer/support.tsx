import { Card, Row, Screen } from '@/components/ui';

export default function SupportScreen() {
  return (
    <Screen title="Claims Desk" subtitle="Claim documents, status checks, and next steps." showLogout>
      <Card>
        <Row label="Phone" value="Contact your assigned InsureIt representative" />
        <Row label="Email" value="Use your registered support contact" />
        <Row label="Hours" value="Monday to Saturday, business hours" />
      </Card>
    </Screen>
  );
}
