import express from 'express';
import Ticket from '../models/Ticket.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Submit a new ticket (issue report or support message)
router.post('/submit', requireAuth, async (req, res) => {
  try {
    const { type, category, subject, message } = req.body;

    if (!type || !category || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const ticket = new Ticket({
      type,
      category,
      subject,
      message,
      submittedBy: req.user.userId,
      submitterName: req.user.name || req.user.email,
      submitterEmail: req.user.email,
      status: 'open',
      priority: type === 'issue' ? 'high' : 'medium'
    });

    await ticket.save();

    res.status(201).json({
      message: 'Ticket submitted successfully',
      ticket: {
        ticketNumber: ticket.ticketNumber,
        type: ticket.type,
        subject: ticket.subject,
        status: ticket.status,
        createdAt: ticket.createdAt
      }
    });
  } catch (error) {
    console.error('Error submitting ticket:', error);
    res.status(500).json({ error: 'Failed to submit ticket' });
  }
});

// Submit support message (public - no auth required)
router.post('/support', async (req, res) => {
  try {
    const { name, email, category, subject, message } = req.body;

    if (!name || !email || !category || !message) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }

    const ticket = new Ticket({
      type: 'support',
      category,
      subject: subject || 'Support Request',
      message,
      submitterName: name,
      submitterEmail: email,
      status: 'open',
      priority: 'medium'
    });

    await ticket.save();

    res.status(201).json({
      message: 'Support message received successfully. We\'ll respond within 24 hours.',
      ticketNumber: ticket.ticketNumber
    });
  } catch (error) {
    console.error('Error submitting support message:', error);
    res.status(500).json({ error: 'Failed to submit support message' });
  }
});

// Get user's own tickets
router.get('/my-tickets', requireAuth, async (req, res) => {
  try {
    const tickets = await Ticket.find({ submittedBy: req.user.userId })
      .sort({ createdAt: -1 })
      .select('-replies.repliedBy');

    res.json({ tickets });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Get single ticket details
router.get('/:ticketNumber', requireAuth, async (req, res) => {
  try {
    const { ticketNumber } = req.params;

    const ticket = await Ticket.findOne({ ticketNumber })
      .populate('submittedBy', 'name email')
      .populate('assignedTo', 'name email');

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check if user is authorized to view this ticket
    if (ticket.submittedBy?.toString() !== req.user.userId && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to view this ticket' });
    }

    res.json({ ticket });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// Add reply to ticket
router.post('/:ticketNumber/reply', requireAuth, async (req, res) => {
  try {
    const { ticketNumber } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const ticket = await Ticket.findOne({ ticketNumber });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check authorization
    const isAdmin = req.user.userType === 'admin';
    const isTicketOwner = ticket.submittedBy?.toString() === req.user.userId;

    if (!isAdmin && !isTicketOwner) {
      return res.status(403).json({ error: 'Unauthorized to reply to this ticket' });
    }

    ticket.replies.push({
      message,
      repliedBy: req.user.userId,
      repliedByName: req.user.name || req.user.email,
      repliedByEmail: req.user.email,
      isAdmin
    });

    // Update status if admin is replying
    if (isAdmin && ticket.status === 'open') {
      ticket.status = 'in-progress';
    }

    await ticket.save();

    res.json({
      message: 'Reply added successfully',
      reply: ticket.replies[ticket.replies.length - 1]
    });
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ error: 'Failed to add reply' });
  }
});

// ========== ADMIN ROUTES ==========

// Get all tickets (Admin only)
router.get('/admin/all', requireAuth, async (req, res) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status, type, priority, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;

    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('submittedBy', 'name email')
        .populate('assignedTo', 'name email'),
      Ticket.countDocuments(filter)
    ]);

    res.json({
      tickets,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Get ticket statistics (Admin only)
router.get('/admin/stats', requireAuth, async (req, res) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      issueCount,
      supportCount,
      urgentTickets
    ] = await Promise.all([
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: 'open' }),
      Ticket.countDocuments({ status: 'in-progress' }),
      Ticket.countDocuments({ status: 'resolved' }),
      Ticket.countDocuments({ type: 'issue' }),
      Ticket.countDocuments({ type: 'support' }),
      Ticket.countDocuments({ priority: 'urgent', status: { $in: ['open', 'in-progress'] } })
    ]);

    res.json({
      stats: {
        total: totalTickets,
        open: openTickets,
        inProgress: inProgressTickets,
        resolved: resolvedTickets,
        issues: issueCount,
        support: supportCount,
        urgent: urgentTickets
      }
    });
  } catch (error) {
    console.error('Error fetching ticket stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Update ticket status/priority (Admin only)
router.patch('/admin/:ticketNumber', requireAuth, async (req, res) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { ticketNumber } = req.params;
    const { status, priority, assignedTo } = req.body;

    const ticket = await Ticket.findOne({ ticketNumber });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (status) {
      ticket.status = status;
      if (status === 'resolved') {
        ticket.resolvedAt = new Date();
      } else if (status === 'closed') {
        ticket.closedAt = new Date();
      }
    }

    if (priority) {
      ticket.priority = priority;
    }

    if (assignedTo !== undefined) {
      ticket.assignedTo = assignedTo || null;
      if (assignedTo) {
        const { default: User } = await import('../models/User.js');
        const assignee = await User.findById(assignedTo);
        if (assignee) {
          ticket.assignedToName = assignee.name || assignee.email;
        }
      } else {
        ticket.assignedToName = null;
      }
    }

    await ticket.save();

    res.json({
      message: 'Ticket updated successfully',
      ticket
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// Delete ticket (Admin only)
router.delete('/admin/:ticketNumber', requireAuth, async (req, res) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { ticketNumber } = req.params;

    const ticket = await Ticket.findOneAndDelete({ ticketNumber });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

export default router;
