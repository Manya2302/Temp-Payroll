import mongoose from 'mongoose';

const projectDaySchema = new mongoose.Schema({
  dayNumber: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  assignees: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: String,
    subtasks: [{
      title: String,
      description: String,
      completed: {
        type: Boolean,
        default: false
      },
      completedAt: Date
    }]
  }],
  taskSummary: {
    type: String,
    required: true
  },
  subtasks: [String],
  expectedDeliverables: [String],
  estimatedHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'completed_pending_approval', 'approved', 'blocked'],
    default: 'pending'
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: Date,
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userName: String,
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
    name: String,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { _id: false });

const projectSchema = new mongoose.Schema({
  projectTitle: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  assignedEmployees: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: String,
    role: String
  }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  preferredEndDate: Date,
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  estimatedEffort: {
    value: Number,
    unit: {
      type: String,
      enum: ['days', 'hours'],
      default: 'days'
    }
  },
  status: {
    type: String,
    enum: ['Draft', 'Scheduled', 'Active', 'In Progress', 'Completed', 'On Hold', 'Blocked', 'Archived'],
    default: 'Draft'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  days: [projectDaySchema],
  distributionSettings: {
    strategy: {
      type: String,
      enum: ['round-robin', 'even-load', 'split-by-days', 'custom'],
      default: 'even-load'
    },
    notes: String
  },
  clientNotes: String,
  notes: String,
  audit: [{
    action: {
      type: String,
      enum: ['created', 'assigned', 'reassigned', 'gemini_generated', 'status_changed', 'day_completed', 'archived']
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedByName: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: String,
    geminiPrompt: String,
    geminiResponse: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

projectSchema.methods.calculateProgress = function() {
  if (!this.days || this.days.length === 0) {
    this.progress = 0;
    return 0;
  }

  const completedDays = this.days.filter(day => 
    day.status === 'completed' || day.status === 'approved'
  ).length;

  this.progress = Math.round((completedDays / this.days.length) * 100);
  return this.progress;
};

projectSchema.methods.updateStatus = function() {
  const totalDays = this.days.length;
  const completedDays = this.days.filter(d => d.status === 'completed' || d.status === 'approved').length;
  const inProgressDays = this.days.filter(d => d.status === 'in_progress').length;

  if (completedDays === totalDays && totalDays > 0) {
    this.status = 'Completed';
  } else if (inProgressDays > 0 || completedDays > 0) {
    this.status = 'In Progress';
  } else if (this.days.some(d => d.status === 'blocked')) {
    this.status = 'Blocked';
  }
};

const Project = mongoose.model('Project', projectSchema);

export default Project;
