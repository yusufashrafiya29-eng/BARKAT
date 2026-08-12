import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SHADOWS, RADIUS, FONT } from '../../constants/theme';
import StatusBadge from '../ui/StatusBadge';
import { Order } from '../../api/types';
import OrderItemRow from './OrderItemRow';

interface OrderCardProps {
  order: Order;
  onAction: (action: string, order: Order) => void;
}

export default React.memo(function OrderCard({ order, onAction }: OrderCardProps) {
  const isCustomerPending = order.source === 'CUSTOMER' && order.status === 'PENDING';

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.tableBadge}>
            <Text style={styles.tableText}>
              {order.table_id ? `T-${order.table_id}` : 'TAKEAWAY'}
            </Text>
          </View>
          <Text style={styles.orderId}>#{order.id.substring(0, 6).toUpperCase()}</Text>
        </View>
        <StatusBadge status={isCustomerPending ? 'customer' : order.status} />
      </View>

      <View style={styles.divider} />

      {/* Items */}
      <View style={styles.itemsContainer}>
        {order.items?.slice(0, 3).map((item, index) => (
          <OrderItemRow key={item.id || index} item={item} />
        ))}
        {order.items && order.items.length > 3 && (
          <Text style={styles.moreItemsText}>
            + {order.items.length - 3} more items
          </Text>
        )}
      </View>

      <View style={styles.divider} />

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.totalText}>₹{order.total_amount?.toFixed(2) || '0.00'}</Text>
        
        <View style={styles.actionsContainer}>
          {isCustomerPending && (
            <>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.rejectBtn]} 
                onPress={() => onAction('REJECT', order)}
              >
                <Text style={styles.rejectText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.acceptBtn]} 
                onPress={() => onAction('ACCEPT', order)}
              >
                <Text style={styles.acceptText}>Accept ✓</Text>
              </TouchableOpacity>
            </>
          )}

          {!isCustomerPending && order.status === 'ACCEPTED' && (
            <TouchableOpacity 
              style={[styles.actionBtn, styles.primaryBtn]} 
              onPress={() => onAction('PREPARING', order)}
            >
              <Text style={styles.primaryText}>Preparing 👨‍🍳</Text>
            </TouchableOpacity>
          )}

          {!isCustomerPending && order.status === 'PREPARING' && (
            <TouchableOpacity 
              style={[styles.actionBtn, styles.primaryBtn]} 
              onPress={() => onAction('READY', order)}
            >
              <Text style={styles.primaryText}>Mark Ready ✓</Text>
            </TouchableOpacity>
          )}

          {!isCustomerPending && order.status === 'READY' && (
            <>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.secondaryBtn]} 
                onPress={() => onAction('SERVED', order)}
              >
                <Text style={styles.secondaryText}>Mark Served</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.primaryBtn]} 
                onPress={() => onAction('BILL', order)}
              >
                <Text style={styles.primaryText}>Bill 🧾</Text>
              </TouchableOpacity>
            </>
          )}

          {!isCustomerPending && order.status === 'SERVED' && (
            <TouchableOpacity 
              style={[styles.actionBtn, styles.primaryBtn]} 
              onPress={() => onAction('BILL', order)}
            >
              <Text style={styles.primaryText}>Generate Bill 🧾</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableBadge: {
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    marginRight: 8,
  },
  tableText: {
    color: COLORS.primaryDark,
    fontWeight: FONT.bold,
    fontSize: 14,
  },
  orderId: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: FONT.medium,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 12,
  },
  itemsContainer: {
    gap: 8,
  },
  moreItemsText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalText: {
    fontSize: 18,
    fontWeight: FONT.bold,
    color: COLORS.text,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
  },
  primaryText: {
    color: COLORS.card,
    fontWeight: FONT.bold,
  },
  secondaryBtn: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryText: {
    color: COLORS.text,
    fontWeight: FONT.semibold,
  },
  acceptBtn: {
    backgroundColor: COLORS.success,
  },
  acceptText: {
    color: COLORS.card,
    fontWeight: FONT.bold,
  },
  rejectBtn: {
    backgroundColor: COLORS.danger + '1A', // transparent red
  },
  rejectText: {
    color: COLORS.danger,
    fontWeight: FONT.semibold,
  },
});
