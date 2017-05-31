import PouchDB from 'pouchdb';

const localDB = new PouchDB('mmt-ss2017');
const remoteDB = new PouchDB('https://couchdb.5k20.com/mmt-ss2017', {
  auth: {
    username: 'sreinsperger',
    password: 'test',
  },
});

export default class Store {
  /**
   * @param {!string} name Database name
   * @param {function()} [callback] Called when the Store is ready
   */
  constructor(name, callback) {
    /**
     * @type {ItemList}
     */
    let liveTodos;

    localDB
      .sync(remoteDB, {
        live: true,
        retry: true,
      })
      .on('change', change => {
      console.log('change', change);

  })
  .on('error', error => {

    });

    /**
     * Read the local ItemList from localStorage.
     *
     * @returns {ItemList} Current array of todos
     */
    this.getStore = () => {
      return new Promise((resolve) => {
          localDB.allDocs({
          include_docs: true,
        }).then(({ rows }) => {

          const todos = rows.map(r => Object.assign({}, r.doc, {
              id: r.doc._id,
            }));
      console.log('todos');
      console.log(todos);
      resolve(todos);
    });
    });
    };


    /**
     * Write the local ItemList to localStorage.
     *
     * @param {ItemList} todos Array of todos to write
     */
    this.setStore = (todos) => {

    };

    if (callback) {
      this.getStore()
        .then((todos) => {
        callback();
    });
    }
  }

  /**
   * Find items with properties matching those on query.
   *
   * @param {ItemQuery} query Query to match
   * @param {function(ItemList)} callback Called when the query is done
   *
   * @example
   * db.find({completed: true}, data => {
	 *	 // data shall contain items whose completed properties are true
	 * })
   */
  find(query, callback) {
    this.getStore()
      .then((todos) => {
      const filteredTodos = todos.filter(todo => {
          for (let k in query) {
      if(query[k] !== todo[k]) {
        return false;
      }
    }
    return true;
  });
    callback(filteredTodos);
  });
  }

  /**
   * Update an item in the Store.
   *
   * @param {ItemUpdate} update Record with an id and a property to update
   * @param {function()} [callback] Called when partialRecord is applied
   */
  update(update, callback) {
    localDB.get(update.id.toString())
      .then((doc) => {
      localDB.put({
      _id: update.id.toString(),
      _rev: doc._rev,
      title: update.title || doc.title,
      completed: update.hasOwnProperty('completed') ? update.completed : doc.completed,
    }).then(callback);
  });
  }

  /**
   * Insert an item into the Store.
   *
   * @param {Item} item Item to insert
   * @param {function()} [callback] Called when item is inserted
   */
  insert(item, callback) {
    const todo = {
      _id: item.id.toString(),
      title: item.title,
      completed: item.completed,
    };
    localDB.put(todo)
      .then(callback);
  }

  /**
   * Remove items from the Store based on a query.
   *
   * @param {ItemQuery} query Query matching the items to remove
   * @param {function(ItemList)|function()} [callback] Called when records matching query are removed
   */
  remove(query, callback) {
    this.getStore()
      .then((todos) => {
      const toDelete = todos.filter((todo) => {
          console.log(todo);

    for (let k in query) {
      if (query[k].toString() === todo[k]) {
        return true;
      }
    }
    return false;
  });

    localDB.bulkDocs(toDelete.map(t => ({
        _id: t._id,
        _rev: t._rev,
        _deleted: true,
      }))).then(callback);
  });
  }

  /**
   * Count total, active, and completed todos.
   *
   * @param {function(number, number, number)} callback Called when the count is completed
   */
  count(callback) {
    this.getStore()
      .then((todos) => {
      const completed = todos.filter(t => t.completed);
    callback(todos.length, todos.length - completed.length, completed.length);
  });
  }
}
