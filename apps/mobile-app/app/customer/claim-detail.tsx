import { useLocalSearchParams } from 'expo-router';
import { Fragment, useEffect, useState } from 'react';
import { Linking } from 'react-native';

import { Button, Card, EmptyState, LoadingState, Message, Row, Screen } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import type { Claim, ClaimDocument, ClaimHistory } from '@/lib/types';

export default function ClaimDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [history, setHistory] = useState<ClaimHistory[]>([]);
  const [documents, setDocuments] = useState<ClaimDocument[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const [claimResult, historyResult, documentsResult] = await Promise.all([
        supabase.from('claims').select('*').eq('id', id).maybeSingle(),
        supabase.from('claim_status_history').select('*').eq('claim_id', id).order('created_at', { ascending: false }),
        supabase.from('claim_documents').select('*').eq('claim_id', id).order('created_at', { ascending: false }),
      ]);
      setClaim(claimResult.data);
      setHistory(historyResult.data ?? []);
      setDocuments(documentsResult.data ?? []);
      setLoading(false);
    }
    void load();
  }, [id]);

  async function openDocument(document: ClaimDocument) {
    setMessage('');
    const { data, error } = await supabase.storage.from(document.storage_bucket).createSignedUrl(document.storage_path, 300);
    if (error || !data?.signedUrl) {
      setMessage('We could not open this document. Please try again.');
      return;
    }
    await Linking.openURL(data.signedUrl);
  }

  if (loading) return <Screen title="Claim Detail"><LoadingState /></Screen>;
  if (!claim) return <Screen title="Claim Detail"><EmptyState title="Claim not found" body="Please go back and choose a claim from your list." /></Screen>;

  return (
    <Screen title="Claim Detail" subtitle="Review claim information and status timeline." showLogout>
      {message ? <Message type="error">{message}</Message> : null}
      <Card>
        <Row label="Claim number" value={claim.claim_no} />
        <Row label="Current status" value={claim.current_status} />
        <Row label="Accident date" value={claim.accident_at?.slice(0, 10)} />
        <Row label="Location" value={claim.accident_location} />
        <Row label="Description" value={claim.accident_description} />
        <Row label="Estimated loss" value={claim.estimated_loss} />
      </Card>
      <Card>
        <Row label="Uploaded documents" value={documents.length} />
        {documents.map((document) => (
          <Fragment key={document.id}>
            <Row label={document.document_type} value={`${document.file_name} - ${document.verification_status}`} />
            <Button label="Open document" variant="secondary" onPress={() => void openDocument(document)} />
          </Fragment>
        ))}
      </Card>
      <Card>
        <Row label="Claim Status Timeline" value={history.length ? undefined : 'No timeline updates yet'} />
        {history.map((item) => <Row key={item.id} label={item.to_status} value={item.notes ?? item.created_at?.slice(0, 10)} />)}
      </Card>
    </Screen>
  );
}
