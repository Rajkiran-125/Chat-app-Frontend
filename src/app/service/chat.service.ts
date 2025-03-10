import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Socket,io } from 'socket.io-client';
import { HttpClient } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class ChatService {

  
  private socket: Socket;
  // private url = 'http://localhost:3000'; // your server local path
  private url = 'https://chat-app-node-socket-io-5m2o.onrender.com'; // your server local path

  constructor(
    private http: HttpClient
  ) {
    this.socket = io(this.url, {transports: ['websocket', 'polling', 'flashsocket']});
  }

  ngOnInit(): void {
    this.wakeUpApi();
  }

  wakeUpApi(){
    const res = this.http.get(this.url);
    console.log('wakeUpApi >>>>>>.',res);
  }

  joinRoom(data): void {
    this.socket.emit('join', data);
    this.socket.emit('user-joined', { username: data.user });
  }


  sendMessage(data): void {
    this.socket.emit('message', data);
  }

  getMessage(): Observable<any> {
    return new Observable<{UserName: string, message: string}>(observer => {
      this.socket.on('new message', (data) => {
        observer.next(data);

        // let storageArray = this.getStorage();
        // const storeIndex = storageArray
        //   .findIndex((storage) => storage.roomId === data.room);
        // if (storeIndex > -1) {
        //   storageArray[storeIndex].chats.push({
        //     user: data.name,
        //     message: data.message
        //   });
        // } else {
        //   const updateStorage = {
        //     roomId: data.room,
        //     chats: [{
        //       user: data.name,
        //       message: data.message
        //     }]
        //   };
        //   console.log(updateStorage)
        //   storageArray.push(updateStorage);
        // }
    
        // this.setStorage(storageArray);
        console.log(data);
      });
      return () => {
        this.socket.disconnect();
      }
    });
  }

  getUserStatus(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('user-status-changed', (data) => {
        observer.next(data);
      });
    });
  }

  getStorage() {
    const storage: string = localStorage.getItem('chats');
    return storage ? JSON.parse(storage) : [];
  }

  setStorage(data) {
    localStorage.setItem('chats', JSON.stringify(data));
  }

}
