const Modal = {
  active: 'active',
  target: null,

  getTarget() {
    if (this.target) {
      return this.target;
    }
    this.target = document.querySelector('.modal-overlay');
    return this.target;
  },

  toggle() {
    const modal = this.getTarget();
    const isOpen = modal.classList.contains(this.active);
    const method = isOpen ? 'remove' : 'add';

    modal.classList[method](this.active);
  }
};

const Form = {
  description: document.querySelector('#description'),
  amount: document.querySelector('#amount'),
  date: document.querySelector('#date'),

  getValues() {
    return {
      description: Form.description.value,
      amount: Form.amount.value,
      date: Form.date.value
    };
  },

  formatData() {},

  validateFields() {
    const { description, amount, date } = Form.getValues();

    const emptyDescription = description.trim() === '';
    const emptyAmount = amount.trim() === '';
    const emptyDate = date.trim() === '';

    if (emptyDescription || emptyAmount || emptyDate) {
      throw new Error('Por favor, preencha todos os campos');
    } 
  },

  formatValues() {
    let { description, amount, date } = Form.getValues();
    
    amount = Utils.formatAmount(amount);    
    date = Utils.formatDate(date);

    return {
      description,
      amount,
      date,
    };
  },

  saveTransaction(transaction) {
    Transaction.add(transaction);
  },

  clearFields() {
    Form.description.value = '';
    Form.amount.value = '';
    Form.date.value = '';
  },

  submit(event) {
    event.preventDefault();

    try {
      Form.validateFields();
      const transaction = Form.formatValues();
      Form.saveTransaction(transaction);
      Form.clearFields();
      Modal.toggle();
    } catch (error) {
      alert(error.message);
    }
  },
};

const Storage = {
  storageId: 'dev.finances:transactions',

  get() {
    const data = localStorage.getItem(Storage.storageId);
    return data ? JSON.parse(data) : [];
  },

  set(transactions) {
    const data = JSON.stringify(transactions);
    localStorage.setItem(Storage.storageId, data);
  },
};

const Transaction = {
  all: Storage.get(),

  getOrderTypes() {
    return {
      DESCRIPTION: 'description',
      AMOUNT: 'amount',
      DATE: 'date'
    };
  },

  orderBy(type = Transaction.getOrderTypes().DATE) {
    
    return Transaction.all.sort((a, b) => {

      if (type === Transaction.getOrderTypes().DATE) {
        const dateA = Utils.formatDateToNumber(a.date);
        const dateB = Utils.formatDateToNumber(b.date);

        return dateA > dateB ? -1 : (dateA < dateB ? 1 : 0);
      }

      if (type === Transaction.getOrderTypes().DESCRIPTION) {
        const descA = a.description.toLowerCase();
        const descB = b.description.toLowerCase();

        return descA < descB ? -1 : (descA > descB ? 1 : 0);
      }

      if (type === Transaction.getOrderTypes().AMOUNT) {
        return b.amount - a.amount;
      }
    });
  },

  add(transaction) {
    Transaction.all.push(transaction);
    App.reload();
  },

  remove(index) {
    const transaction = Transaction.all[index];
    if (transaction) {
      Transaction.all.splice(index, 1);
      App.reload();
    }
  },

  incomes() {
    let income = 0;

    Transaction.all.forEach(transaction => {
      if (transaction.amount > 0) {
        income += transaction.amount;
      }
    });

    return income;
  },

  expenses() {
    let expense = 0;

    Transaction.all.forEach(transaction => {
      if (transaction.amount < 0) {
        expense += transaction.amount;
      }
    });

    return expense;
  },

  total() {
    return Transaction.incomes() + Transaction.expenses();
  }
};

const DOM = {
  transactionsHeader: document.querySelector('#data-table thead'),
  transactionsContainer: document.querySelector('#data-table tbody'),

  addTransaction(transaction, index) {
    const tr = document.createElement('tr');
    tr.innerHTML = DOM.innerHTMLTransaction(transaction, index);
    tr.dataset.index = index;

    DOM.transactionsContainer.appendChild(tr);
  },

  innerHTMLTransaction(transaction, index) {
    const { description, amount, date } = transaction;
    const cssClass = amount > -1 ? 'income' : 'expense';
    const formatedAmount = Utils.formatCurrency(amount);

    return `
      <td class="description">${description}</td>
      <td class="${cssClass}">${formatedAmount}</td>
      <td class="date">${date}</td>
      <td>
        <img onclick="Transaction.remove(${index})" src="assets/minus.svg" alt="Remover transação">
      </td>
    `;
  },

  updateBalance() {
    const income = Transaction.incomes();
    const expense = Transaction.expenses();
    const total = Transaction.total();

    document
      .getElementById('incomeDisplay')
      .innerHTML = Utils.formatCurrency(income);

    document
      .getElementById('expenseDisplay')
      .innerHTML = Utils.formatCurrency(expense);

    document
      .getElementById('totalDisplay')
      .innerHTML = Utils.formatCurrency(total);
  },

  clearTransactions() {
    DOM.transactionsContainer.innerHTML = null;
  },

  orderTable(event, type) {
    const orderClass = 'orderby';

    this.transactionsHeader.querySelectorAll('th').forEach(th => th.classList.remove(orderClass));
    event.classList.add(orderClass);

    App.reload(type);
  },
};

const Utils = {

  formatDateToNumber(date) {
    return Number(date.split('/').reverse().join(''));
  },

  formatDate(date) {
    return date.split('-').reverse().join('/');
  },

  formatAmount(value) {
    return Number(value) * 100;
  },

  formatCurrency(value) {
    const signal = Number(value) < 0 ? '-' : '';

    value = String(value).replace(/\D/g, '');

    value = Number(value) / 100;

    value = value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

    return signal + value;
  }
};

const App = {

  init(orderBy) {
    Transaction.orderBy(orderBy).forEach(DOM.addTransaction);
    DOM.updateBalance();
    Storage.set(Transaction.all);
  },

  reload(orderBy) {
    DOM.clearTransactions();
    App.init(orderBy);
  },
};

App.init();
