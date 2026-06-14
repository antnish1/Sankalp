import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, EmptyState, LoadingState, Message, Screen } from '@/components/ui';
import { getCurrentSession, getProfile, isValidProfile } from '@/lib/auth';
import { canManageUsers, roleLabels } from '@/lib/roles';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';

type OrgNode = Profile & { children: OrgNode[] };

export default function ItOrganizationScreen() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const session = await getCurrentSession();
        if (!session?.user) return router.replace('/login');
        const profile = await getProfile(session.user.id);
        if (!isValidProfile(profile) || !canManageUsers(profile.role)) return router.replace('/access-denied');
        const { data, error } = await supabase.from('profiles').select('*').order('full_name');
        if (error) throw error;
        setProfiles(data ?? []);
      } catch (error) {
        console.error('IT organization load failed', error);
        setMessage('We could not load the organization hierarchy.');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [router]);

  const tree = useMemo(() => buildTree(profiles), [profiles]);

  if (loading) {
    return (
      <Screen title="Organization Hierarchy">
        <LoadingState label="Loading hierarchy" />
      </Screen>
    );
  }

  return (
    <Screen title="Organization Hierarchy" subtitle="Reporting managers and team structure">
      {message ? <Message type="error">{message}</Message> : null}
      <View style={styles.sectionBadge}>
        <MaterialCommunityIcons name="family-tree" size={22} color="#18A058" />
        <Text style={styles.sectionBadgeText}>Live reporting map</Text>
      </View>
      {tree.length ? tree.map((node) => <NodeCard key={node.id} node={node} depth={0} />) : (
        <EmptyState title="No profiles found" body="Create users to start building the hierarchy." />
      )}
      <Button label="Back to control center" variant="secondary" onPress={() => router.replace('/it/dashboard')} />
    </Screen>
  );
}

function buildTree(rows: Profile[]) {
  const nodes = new Map<string, OrgNode>();
  rows.forEach((row) => nodes.set(row.id, { ...row, children: [] }));
  const roots: OrgNode[] = [];
  nodes.forEach((node) => {
    const parent = node.reporting_manager_id ? nodes.get(node.reporting_manager_id) : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  });
  return roots;
}

function NodeCard({ node, depth }: { node: OrgNode; depth: number }) {
  return (
    <View style={[styles.nodeCard, { marginLeft: Math.min(depth * 14, 42) }]}>
      <View style={styles.nodeTop}>
        <View style={[styles.statusDot, node.is_active ? styles.activeDot : styles.inactiveDot]} />
        <View style={styles.nodeCopy}>
          <Text style={styles.nodeName} numberOfLines={1}>{node.full_name}</Text>
          <Text style={styles.nodeMeta} numberOfLines={1}>{roleLabels[node.role]} {node.employee_code ? `| ${node.employee_code}` : ''}</Text>
        </View>
        <Text style={[styles.statusText, node.is_active ? styles.activeText : styles.inactiveText]}>{node.is_active ? 'Active' : 'Inactive'}</Text>
      </View>
      {node.children.length ? (
        <View style={styles.children}>
          {node.children.map((child) => <NodeCard key={child.id} node={child} depth={depth + 1} />)}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionBadge: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#D8DEE8', padding: 13, marginBottom: 14 },
  sectionBadgeText: { color: '#0B1F3A', fontSize: 15, fontWeight: '900' },
  nodeCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 13, marginBottom: 10, borderWidth: 1, borderColor: '#D8DEE8', shadowColor: '#0B1F3A', shadowOpacity: 0.05, shadowRadius: 10, elevation: 1 },
  nodeTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot: { width: 11, height: 11, borderRadius: 6 },
  activeDot: { backgroundColor: '#18A058' },
  inactiveDot: { backgroundColor: '#F79009' },
  nodeCopy: { flex: 1, minWidth: 0 },
  nodeName: { color: '#0B1F3A', fontSize: 15, fontWeight: '900' },
  nodeMeta: { color: '#667085', fontSize: 12, marginTop: 3 },
  statusText: { fontSize: 11, fontWeight: '900' },
  activeText: { color: '#067647' },
  inactiveText: { color: '#B54708' },
  children: { marginTop: 10 },
});
