import { Component, inject } from '@angular/core';
import { Task } from './task/task';
import { CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { TaskDialogComponent } from './task-dialog/task-dialog.component';
import { TaskDialogResult } from './task-dialog/task-dialog.component';
import { CollectionReference, Firestore, FirestoreModule, collection, collectionData, doc, setDoc, deleteDoc, addDoc, updateDoc, runTransaction } from '@angular/fire/firestore';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'kanban-fire';
  todoCollection: CollectionReference = collection(this.store,'todo');
  inProgressCollection : CollectionReference = collection(this.store, 'inProgress');
  doneCollection: CollectionReference = collection(this.store, 'done');
  todo: any;
  inProgress: any;
  done: any;

  constructor(private dialog: MatDialog, private store: Firestore = inject(Firestore)) {
    this.todo = collectionData(this.todoCollection);
    this.inProgress = collectionData(this.inProgressCollection);
    this.done = collectionData(this.doneCollection);
  }

  editTask(list: 'done' | 'todo' | 'inProgress', task: Task): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task,
        enableDelete: true,
      },
    });
    dialogRef.afterClosed().subscribe((result: TaskDialogResult|undefined) => {
      if (!result) {
        return;
      }
      if (result.delete) {
        deleteDoc(doc(this.store, `${list}/${task.title}`));
      } else {
        updateDoc(doc(this.store, `${list}/${task.title}`), <object>task);
      }
    });
  }

  drop(event: CdkDragDrop<any>): void {
    if (event.previousContainer === event.container) {
      return;
    }
    const item = event.previousContainer.data[event.currentIndex];
    runTransaction(this.store,() => {
      const promise = Promise.all([
        deleteDoc(doc(this.store, `${event.previousContainer.id}/${item.title}`)),
        setDoc(doc(this.store, `${event.container.id}/${item.title}`), item), //using set doc in order to specify document name
      ]);
      return promise;
    });
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
  }

  newTask(): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task: {},
      },
    });
    dialogRef.afterClosed().subscribe((result: TaskDialogResult|undefined) => {
      if (!result) {
        return;
      }
      setDoc(doc(this.store,`todo/${result.task.title}`),result.task);
      if (result.delete) {
        // deleteDoc(doc(this.store,`${list}/${task.id}`));
      } else {
        // updateDoc(doc(this.store,`${list}/${task.id}`),task)
      }
    });
  }
}
