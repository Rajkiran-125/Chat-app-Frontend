import { Component, HostListener, ViewChild, AfterViewChecked, ElementRef, OnDestroy } from '@angular/core';
import { ChatService } from './service/chat.service';
import { ApiService } from './service/api.service';
import { lastValueFrom } from 'rxjs';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewChecked {

  @ViewChild('msgBody') private msgBody!: ElementRef;
  title = 'chat-app';

  isOpened = false;
  version: string = 'V.0.0.9'

  public roomId: any;
  public messageText: string;
  public messageArray: { UserName: string, message: string, dateTime: string }[] = [];
  private storageArray = [];

  public showScreen = false;
  public phone: string;
  public currentUser;
  public selectedUser;
  public loginUser;
  previousMessageCount = 0;
  dateTime = new Date();
  private timer: any;

  menuToggled = true;
  replyText = '';

  userList: any;
  roomIdDetails: any;

  // public userList = [
  //   {
  //     id: 1,
  //     UserName: 'Rajkiran Jaiswar',
  //     phone: '8286231170',
  //     ProfilePic: 'https://bootdey.com/img/Content/avatar/avatar1.png',
  //     roomId: {
  //       2: 'room-1',
  //       3: 'room-4',
  //       4: 'room-3'
  //     }
  //   },
  //   {
  //     id: 2,
  //     UserName: 'Mohit',
  //     phone: '18',
  //     ProfilePic: 'https://bootdey.com/img/Content/avatar/avatar2.png',
  //     roomId: {
  //       1: 'room-1',
  //       3: 'room-2',
  //       4: 'room-5'
  //     }
  //   },
  //   {
  //     id: 3,
  //     UserName: 'Neha',
  //     phone: '10',
  //     ProfilePic: 'https://bootdey.com/img/Content/avatar/avatar3.png',
  //     roomId: {
  //       1: 'room-4',
  //       2: 'room-2',
  //       4: 'room-6'
  //     }
  //   },
  //   {
  //     id: 4,
  //     UserName: 'Kamlesh',
  //     phone: '20',
  //     ProfilePic: 'https://bootdey.com/img/Content/avatar/avatar4.png',
  //     roomId: {
  //       1: 'room-3',
  //       2: 'room-5',
  //       3: 'room-6'
  //     }
  //   }
  // ];

  constructor(
    private chatService: ChatService,
    private api: ApiService
  ) {
  }

  startTimer(): void {
    this.timer = setInterval(() => {
      this.dateTime = new Date(this.dateTime.getTime() + 1000); // Add 1 second
    }, 1000);
  }

  ngAfterViewChecked() {
    this.scrollIfNewMessage();
  }
  scrollIfNewMessage(): void {
    if (this.messageArray.length > this.previousMessageCount) {
      this.scrollToBottom();
      this.previousMessageCount = this.messageArray.length;
    }
  }

  scrollToBottom(): void {
    try {
      this.msgBody.nativeElement.scrollTop = this.msgBody.nativeElement.scrollHeight;
    } catch (err) {
      console.error("Error scrolling to bottom:", err);
    }
  }

  ngOnInit(): void {
    this.startTimer();
    this.getUserList();

    // Subscribe to new messages, but only process them if they match the current roomId
    this.chatService.getMessage().subscribe((data: { UserName: string; room: string; message: string, dateTime: string }) => {
      // Ensure the incoming message is for the selected UserName's room
      if (data.room === this.roomId) {
        const newMessage = {
          UserName: data.UserName,
          message: data.message,
          dateTime: data.dateTime
        };

        // Add the message to the messageArray and update storage
        this.messageArray.push(newMessage);
        this.updateStorageIfNotExists(newMessage, data.room);

        // Scroll to the bottom after adding the message
        setTimeout(() => this.scrollToBottom(), 100);
      } else {
        const newMessage = {
          UserName: data.UserName,
          message: data.message,
          dateTime: data.dateTime
        };
        this.updateStorageIfNotExists(newMessage, data.room);
      }
    });

    // Load existing messages from storage when component initializes
    this.loadMessagesFromStorage();
  }

  getUserList() {
    let obj = {
      "data": {
        "spname": "sp_ca_getUserList",
        "parameters": {
        }
      }
    }
    this.api.post('index/json', obj).subscribe(res => {
      if (res['code'] == 200) {
        if (res['results'].data && res['results'].data.length > 0) {
          this.userList = res['results'].data;
          localStorage.setItem('userList', JSON.stringify(res['results'].data));
        } else {

        }
      } else {
        console.log('UserName data get Failed >>>>>')
      }
      console.log('UserName data get >>>>>>', res);
    })
  }

  loadMessagesFromStorage(): void {
    this.storageArray = this.chatService.getStorage();
    const storeIndex = this.storageArray.findIndex((storage) => storage.roomId === this.roomId);

    // If roomId exists in storage, set messageArray to its chats
    if (storeIndex > -1) {
      this.messageArray = this.storageArray[storeIndex].chats;
    } else {
      this.messageArray = []; // Clear messages if no matching roomId is found
    }

    // Scroll to the bottom after loading messages
    setTimeout(() => this.scrollToBottom(), 100);
  }

  updateStorageIfNotExists(newMessage: { UserName: string; message: string; dateTime: string }, roomId): void {
    const storeIndex = this.storageArray.findIndex((storage) => storage.roomId === roomId);

    if (storeIndex > -1) {
      // Check for duplicate messages by matching message content and dateTime
      const exists = this.storageArray[storeIndex].chats.some(
        (chat) => chat.message === newMessage.message && chat.dateTime === newMessage.dateTime
      );
      if (!exists) {
        this.storageArray[storeIndex].chats.push(newMessage); // Add if not duplicate
      }
    } else {
      // Create a new room entry if roomId is not found
      this.storageArray.push({
        roomId: this.roomId,
        chats: [newMessage]
      });
    }

    // Update localStorage with the new state
    this.chatService.setStorage(this.storageArray);
  }

  valueRecievedOutput(value) {
    console.log('value', value);
    this.phone = value.phone;
    this.showScreen = value.showScreen;
    this.login();
  }

  toggleMenu() {
    this.menuToggled = !this.menuToggled;
  }

  login(): void {

    this.currentUser = this.userList.find(UserName => UserName.Phone === this.phone.toString());
    this.loginUser = this.userList.filter((UserName) => UserName.Phone == this.phone.toString());
    this.userList = this.userList.filter((UserName) => UserName.Phone !== this.phone.toString());

    console.log(this.loginUser);
    if (this.currentUser) {
      this.showScreen = true;
      console.log('this.showScreen', this.showScreen)
    }
  }

  async getRoomId(userId,selectedUserId) {
    const obj = {
      "data": {
        "spname": "sp_ca_getRoomId",
        "parameters": {
          "UserId": userId,
          "selectedUserId":selectedUserId
        }
      }
    };
  
    try {
      const res = await lastValueFrom(this.api.post('index/json', obj));
      if (res['code'] === 200) {
        if (res['results'].data && res['results'].data.length > 0) {
          return res['results'].data[0].RoomId;
        } else {
          console.log('Room Id res Path is changed');
        }
      } else {
        console.log('UserName data get Failed >>>>>');
      }
      console.log('UserName data get >>>>>>', res);
      return null;
    } catch (error) {
      console.error('API call failed', error);
      return null;
    }
  }
  

  async selectUserHandler(Phone: string) {
    console.log('this.userlist >>>>>', this.userList)
    this.selectedUser = this.userList.find(UserName => UserName.Phone === Phone);
    console.log('this.selectedUser >>>>', this.selectedUser)
    console.log('this.loginUser >>>>', this.loginUser)
    
    this.roomId = await this.getRoomId(this.loginUser[0].Id, this.selectedUser.Id);
    console.log('this.roomId >>>>', this.roomId)
    this.messageArray = [];

    this.storageArray = this.chatService.getStorage();
    const storeIndex = this.storageArray
      .findIndex((storage) => storage.roomId === this.roomId);

    if (storeIndex > -1) {
      this.messageArray = this.storageArray[storeIndex].chats;
    }
    this.join(this.currentUser.UserName, this.roomId);
  }

  join(userUserName: string, roomId: string): void {
    this.chatService.joinRoom({ UserName: userUserName, room: roomId });
    setTimeout(() => {
      this.scrollToBottom();
    }, 10);
  }


  sendMessage(): void {

    if (!this.messageText.trim()) return;

    const date = this.dateTime.toISOString()

    this.chatService.sendMessage({
      UserName: this.currentUser.UserName,
      room: this.roomId,
      message: this.messageText,
      dateTime: date
    });

    if (this.replyText.trim()) {
      console.log('Message sent:', this.replyText);
      this.replyText = ''; // Clear the textarea
    }

    this.storageArray = this.chatService.getStorage();
    const storeIndex = this.storageArray.findIndex((storage) => storage.roomId === this.roomId);

    const newMessage = {
      UserName: this.currentUser.UserName,
      message: this.messageText,
      dateTime: date
    };

    if (storeIndex > -1) {
      this.storageArray[storeIndex].chats.push(newMessage);
    } else {
      const updateStorage = {
        roomId: this.roomId,
        chats: [newMessage]
      };
      console.log(updateStorage);
      this.storageArray.push(updateStorage);
    }

    this.chatService.setStorage(this.storageArray);
    this.messageText = '';
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

}
