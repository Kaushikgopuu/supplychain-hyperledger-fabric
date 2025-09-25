import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:3001', {
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        newSocket.emit('join-room', user.id);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      // Listen for various notification types
      newSocket.on('notification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
        toast(notification.message, {
          icon: getNotificationIcon(notification.type),
        });
      });

      newSocket.on('product-created', (data) => {
        toast.success(`New product created: ${data.name}`);
        setNotifications(prev => [{
          id: Date.now(),
          type: 'product-created',
          title: 'Product Created',
          message: `New product "${data.name}" has been created`,
          data: data,
          createdAt: new Date().toISOString(),
          read: false
        }, ...prev]);
      });

      newSocket.on('product-transferred', (data) => {
        toast.success(`Product transferred to ${data.to}`);
        setNotifications(prev => [{
          id: Date.now(),
          type: 'product-transferred',
          title: 'Product Transferred',
          message: `Product has been transferred to ${data.to} at ${data.location}`,
          data: data,
          createdAt: new Date().toISOString(),
          read: false
        }, ...prev]);
      });

      newSocket.on('product-received', (data) => {
        toast.success(`Product received from ${data.from}`);
        setNotifications(prev => [{
          id: Date.now(),
          type: 'product-received',
          title: 'Product Received',
          message: `You received a product from ${data.from} at ${data.location}`,
          data: data,
          createdAt: new Date().toISOString(),
          read: false
        }, ...prev]);
      });

      newSocket.on('product-status-updated', (data) => {
        toast(`Product status updated: ${data.status}`);
        setNotifications(prev => [{
          id: Date.now(),
          type: 'product-status-updated',
          title: 'Product Status Updated',
          message: `Product status updated to "${data.status}" at ${data.location}`,
          data: data,
          createdAt: new Date().toISOString(),
          read: false
        }, ...prev]);
      });

      newSocket.on('new-order', (data) => {
        toast.success(`New order received!`);
        setNotifications(prev => [{
          id: Date.now(),
          type: 'new-order',
          title: 'New Order',
          message: `You received a new order from ${data.buyerId}`,
          data: data,
          createdAt: new Date().toISOString(),
          read: false
        }, ...prev]);
      });

      newSocket.on('order-created', (data) => {
        toast.success(`Order created successfully!`);
        setNotifications(prev => [{
          id: Date.now(),
          type: 'order-created',
          title: 'Order Created',
          message: `Your order has been created successfully`,
          data: data,
          createdAt: new Date().toISOString(),
          read: false
        }, ...prev]);
      });

      newSocket.on('order-status-updated', (data) => {
        toast(`Order status: ${data.status}`);
        setNotifications(prev => [{
          id: Date.now(),
          type: 'order-status-updated',
          title: 'Order Status Updated',
          message: `Order status updated to "${data.status}"`,
          data: data,
          createdAt: new Date().toISOString(),
          read: false
        }, ...prev]);
      });

      newSocket.on('order-cancelled', (data) => {
        toast.error(`Order cancelled`);
        setNotifications(prev => [{
          id: Date.now(),
          type: 'order-cancelled',
          title: 'Order Cancelled',
          message: `Order has been cancelled by ${data.cancelledBy}`,
          data: data,
          createdAt: new Date().toISOString(),
          read: false
        }, ...prev]);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'product-created':
        return '📦';
      case 'product-transferred':
        return '🚚';
      case 'product-received':
        return '✅';
      case 'order-created':
        return '🛒';
      case 'order-status-updated':
        return '📋';
      case 'order-cancelled':
        return '❌';
      default:
        return '🔔';
    }
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true, readAt: new Date().toISOString() }
          : notification
      )
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.read).length;
  };

  const value = {
    socket,
    notifications,
    markNotificationAsRead,
    clearNotifications,
    getUnreadCount
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};