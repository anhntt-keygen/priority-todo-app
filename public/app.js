// Quản lý State của ứng dụng
let todos = [];
let currentStatusFilter = 'all';
let currentPriorityFilter = 'all';
let currentSort = 'priority-desc';

// Khởi tạo ứng dụng
document.addEventListener('DOMContentLoaded', () => {
  loadTodos();
  setupEventListeners();
});

// Tải dữ liệu (Đồng bộ kép: Ưu tiên API, dự phòng LocalStorage)
async function loadTodos() {
  try {
    const response = await fetch('/api/todos');
    if (response.ok) {
      todos = await response.json();
      // Cập nhật lại LocalStorage để đồng bộ
      localStorage.setItem('todos', JSON.stringify(todos));
    } else {
      throw new Error('Lỗi kết nối API');
    }
  } catch (error) {
    console.warn('Không thể kết nối API, chuyển sang sử dụng LocalStorage:', error);
    const localData = localStorage.getItem('todos');
    todos = localData ? JSON.parse(localData) : [];
  }
  render();
}

// Lưu dữ liệu đồng bộ lên cả API và LocalStorage
async function saveTodoState(actionFn, fallbackFn) {
  // Thực hiện thay đổi local trước để UI phản hồi ngay lập tức (Optimistic UI)
  fallbackFn();
  localStorage.setItem('todos', JSON.stringify(todos));
  render();

  try {
    await actionFn();
  } catch (error) {
    console.error('Lỗi đồng bộ API:', error);
  }
}

// Thiết lập các sự kiện lắng nghe
function setupEventListeners() {
  // Form thêm mới
  const form = document.getElementById('todo-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titleInput = document.getElementById('todo-input');
    const prioritySelect = document.getElementById('todo-priority-select');
    const dateInput = document.getElementById('todo-date');

    const newTodoData = {
      title: titleInput.value.trim(),
      priority: prioritySelect.value,
      dueDate: dateInput.value || null
    };

    const tempId = Date.now().toString();
    const tempTodo = {
      id: tempId,
      ...newTodoData,
      completed: false,
      createdAt: new Date().toISOString()
    };

    await saveTodoState(
      async () => {
        const response = await fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTodoData)
        });
        if (response.ok) {
          const savedTodo = await response.json();
          // Thay thế todo tạm bằng todo chính thức từ server
          todos = todos.map(t => t.id === tempId ? savedTodo : t);
          localStorage.setItem('todos', JSON.stringify(todos));
          render();
        }
      },
      () => {
        todos.push(tempTodo);
      }
    );

    form.reset();
  });

  // Lọc theo trạng thái
  const statusBtns = document.querySelectorAll('.filter-status-btn');
  statusBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      statusBtns.forEach(b => {
        b.classList.remove('bg-white', 'text-slate-800', 'shadow-sm');
        b.classList.add('text-slate-500');
      });
      e.target.classList.add('bg-white', 'text-slate-800', 'shadow-sm');
      currentStatusFilter = e.target.getAttribute('data-status');
      render();
    });
  });

  // Lọc theo mức độ ưu tiên
  const priorityFilter = document.getElementById('todo-filter-priority');
  priorityFilter.addEventListener('change', (e) => {
    currentPriorityFilter = e.target.value;
    render();
  });

  // Sắp xếp
  const sortSelect = document.getElementById('todo-sort');
  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    render();
  });
}

// Đổi trạng thái hoàn thành
async function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  const newStatus = !todo.completed;

  await saveTodoState(
    async () => {
      await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: newStatus })
      });
    },
    () => {
      todo.completed = newStatus;
    }
  );
}

// Xóa công việc
async function deleteTodo(id) {
  await saveTodoState(
    async () => {
      await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    },
    () => {
      todos = todos.filter(t => t.id !== id);
    }
  );
}

// Định nghĩa trọng số ưu tiên để sắp xếp
const priorityWeight = { high: 3, medium: 2, low: 1 };

// Render giao diện và cập nhật thống kê
function render() {
  const listContainer = document.getElementById('todo-list');
  const emptyState = document.getElementById('empty-state');
  
  // 1. Lọc dữ liệu
  let filteredTodos = todos.filter(todo => {
    const matchStatus = currentStatusFilter === 'all' || 
      (currentStatusFilter === 'completed' && todo.completed) || 
      (currentStatusFilter === 'active' && !todo.completed);
      
    const matchPriority = currentPriorityFilter === 'all' || todo.priority === currentPriorityFilter;
    
    return matchStatus && matchPriority;
  });

  // 2. Sắp xếp dữ liệu
  filteredTodos.sort((a, b) => {
    if (currentSort === 'priority-desc') {
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    }
    if (currentSort === 'priority-asc') {
      return priorityWeight[a.priority] - priorityWeight[b.priority];
    }
    if (currentSort === 'date-asc') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    if (currentSort === 'date-desc') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(b.dueDate) - new Date(a.dueDate);
    }
    return 0;
  });

  // 3. Hiển thị danh sách
  listContainer.innerHTML = '';
  if (filteredTodos.length === 0) {
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');
    filteredTodos.forEach(todo => {
      const item = document.createElement('div');
      item.className = `todo-item-transition bg-white p-4 rounded-xl border-l-4 shadow-sm flex items-center justify-between gap-4 ${getPriorityBorderClass(todo.priority)}`;
      item.setAttribute('data-testid', 'todo-item');
      item.setAttribute('data-priority', todo.priority);

      item.innerHTML = `
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <input type="checkbox" ${todo.completed ? 'checked' : ''} 
            onchange="toggleTodo('${todo.id}')"
            class="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer">
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-slate-700 truncate ${todo.completed ? 'completed-line-through' : ''}">${todo.title}</p>
            <div class="flex items-center gap-2 mt-1">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getPriorityBadgeClass(todo.priority)}">
                ${todo.priority}
              </span>
              ${todo.dueDate ? `
                <span class="text-xs text-slate-400 flex items-center gap-1">
                  📅 ${formatDate(todo.dueDate)}
                </span>
              ` : ''}
            </div>
          </div>
        </div>
        <button onclick="deleteTodo('${todo.id}')" class="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-2 rounded-lg transition-all">
          🗑️
        </button>
      `;
      listContainer.appendChild(item);
    });
  }

  // 4. Cập nhật thống kê
  updateStats();
}

// Các hàm bổ trợ giao diện
function getPriorityBorderClass(priority) {
  switch (priority) {
    case 'high': return 'border-l-rose-500';
    case 'medium': return 'border-l-amber-500';
    case 'low': return 'border-l-emerald-500';
    default: return 'border-l-slate-300';
  }
}

function getPriorityBadgeClass(priority) {
  switch (priority) {
    case 'high': return 'bg-rose-100 text-rose-700';
    case 'medium': return 'bg-amber-100 text-amber-700';
    case 'low': return 'bg-emerald-100 text-emerald-700';
    default: return 'bg-slate-100 text-slate-700';
  }
}

function formatDate(dateStr) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateStr).toLocaleDateString('vi-VN', options);
}

function updateStats() {
  const total = todos.length;
  const completed = todos.filter(t => t.completed).length;
  const high = todos.filter(t => t.priority === 'high').length;
  const medium = todos.filter(t => t.priority === 'medium').length;
  const low = todos.filter(t => t.priority === 'low').length;

  document.getElementById('stat-total').innerText = total;
  document.getElementById('stat-high').innerText = high;
  document.getElementById('stat-medium').innerText = medium;
  document.getElementById('stat-low').innerText = low;

  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
  document.getElementById('progress-bar').style.width = `${progressPercent}%`;
}
```

---