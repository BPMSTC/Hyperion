import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TaskList } from './task-list';
// Use the HTTP testing backend instead of the real client
import { HttpClientTestingModule, HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';


describe('TaskList - Character Limits and Validation', () => {
  let component: TaskList;
  let fixture: ComponentFixture<TaskList>;
  let httpMock: HttpTestingController;

  // handy matcher so we do not couple tests to the exact base URL
  const isTasksUrl = (req: any) => req.url.endsWith('/tasks');


  // ========== SETUP ==========
  // This runs before EACH test to set up a fresh component
  beforeEach(async () => {
    // Step 1: Configure TestBed with the component
    await TestBed.configureTestingModule({
      imports: [TaskList, HttpClientTestingModule], 
    }).compileComponents();

    // Step 2: Create the component instance
    fixture = TestBed.createComponent(TaskList);
    component = fixture.componentInstance;

    // Step 3: Tell Angular to render the template
    fixture.detectChanges();

    httpMock = TestBed.inject(HttpTestingController);
    
    // If TaskList loads tasks on init, satisfy that GET so the component is stable.
    // If it does not, this line is harmless: expectNone is the alternative.
    const maybeInitGet = httpMock.match(isTasksUrl).find(r => r.request.method === 'GET');
    if (maybeInitGet) {
      maybeInitGet.flush([]);
    }

    localStorage.clear();
  });

    afterEach(() => {
    // Ensures you did not forget to flush any requests in a test
    httpMock.verify();
  });

  // ========== TEST 1: Component Creation ==========
  it('should create the TaskList component', () => {
    expect(component).toBeTruthy();
  });

  // ========== TEST 2: Submission Without Input ==========
  // This tests that the form does NOT add a task when title is empty
  it('should NOT add a task when title is empty', () => {
    // Arrange: Set up the initial state
    component.newTitle = ''; // Empty title
    component.newDescription = 'Some description';
    const initialTaskCount = component.tasks.length;

    // Act: Call addTask (which would normally be called by form submit)
    component.addTask();

    // No network call should be made
    httpMock.expectNone(isTasksUrl);
    expect(component.tasks.length).toBe(initialTaskCount);
  });

  // ========== TEST 3: Submission Without Input (Whitespace Only) ==========
  // This tests that spaces/tabs/newlines are treated as empty
  it('should NOT add a task when title is only whitespace', () => {
    // Arrange
    component.newTitle = '   '; // Only spaces
    component.newDescription = 'Description';
    const initialTaskCount = component.tasks.length;

    // Act
    component.addTask();

    // Assert
    httpMock.expectNone(isTasksUrl);
    expect(component.tasks.length).toBe(initialTaskCount);
  });

  // ========== TEST 4: Successful Task Addition ==========
  // This is a "sanity check" - verify that valid input DOES add a task
  it('should add a task when title is provided', () => {
    // Arrange
    component.newTitle = 'Buy groceries';
    component.newDescription = 'Milk, eggs, bread';
    const initialTaskCount = component.tasks.length;

    // Act
    component.addTask();

    // Intercept the POST and assert the payload
    const post = httpMock.expectOne(isTasksUrl);
    expect(post.request.method).toBe('POST');

    const body = post.request.body as any;
    expect(body.title).toBe('Buy groceries');
    expect(body.description).toBe('Milk, eggs, bread');

    // Respond so the component can update its state
    post.flush({ id: 1, ...body });

    // Now the component has the new task
    expect(component.tasks.length).toBe(initialTaskCount + 1);
    expect(component.tasks[0].title).toBe('Buy groceries');
    expect(component.tasks[0].description).toBe('Milk, eggs, bread');
  });

  // ========== TEST 5: Form Fields Clear After Submission ==========
  // This verifies that input fields reset after adding a task
  it('should clear input fields after adding a task', () => {
    // Arrange
    component.newTitle = 'Test task';
    component.newDescription = 'Test description';

    // Act
    component.addTask();

    const post = httpMock.expectOne(isTasksUrl);
    post.flush({ id: 1, ...post.request.body });

    expect(component.newTitle).toBe('');
    expect(component.newDescription).toBe('');
  });

  // ========== TEST 6: Character Limit - Title (if you add one) ==========
  // NOTE: Your current code doesn't enforce a character limit in the component.
  // This test assumes you ADD a character limit. If you want, I can show you
  // how to add that first. For now, this is a template you can use.
  
  // it('should truncate or prevent title exceeding 100 characters', () => {
  //   const longTitle = 'a'.repeat(101); // 101 characters
  //   component.newTitle = longTitle;
  //
  //   component.addTask();
  //
  //   // This depends on your implementation:
  //   // Either it truncates to 100 chars...
  //   expect(component.tasks[0].title.length).toBeLessThanOrEqual(100);
  //   // OR it doesn't add the task at all...
  //   // expect(component.tasks.length).toBe(0);
  // });

  // ========== TEST 7: Trim Whitespace from Title ==========
  // This verifies that leading/trailing spaces are removed
  it('should trim whitespace from title before saving', () => {
    // Arrange
    component.newTitle = '   Buy groceries   '; // Spaces before and after
    component.newDescription = 'Test';

    // Act
    component.addTask();

    // Assert
    const post = httpMock.expectOne(isTasksUrl);
    // The important assertion: the outgoing payload is trimmed
    expect((post.request.body as any).title).toBe('Buy groceries');
    post.flush({ id: 1, ...post.request.body });

    // Optional: confirm the stored task is trimmed too
    expect(component.tasks[0].title).toBe('Buy groceries');
  });

  // ========== TEST 8: Trim Whitespace from Description ==========
  it('should trim whitespace from description before saving', () => {
    // Arrange
    component.newTitle = 'Task title';
    component.newDescription = '   Description text   '; // Spaces before and after

    // Act
    component.addTask();

    // Assert
    const post = httpMock.expectOne(isTasksUrl);
    expect((post.request.body as any).description).toBe('Description text');
    post.flush({ id: 1, ...post.request.body });

    expect(component.tasks[0].description).toBe('Description text');
  });

  // ========== TEST 9: Empty Description Defaults to Empty String ==========
  // This verifies that if description is omitted, it becomes an empty string
  it('should set description to empty string if not provided', () => {
    // Arrange
    component.newTitle = 'Task';
    component.newDescription = ''; // No description

    // Act
    component.addTask();

    // Assert
    const post = httpMock.expectOne(isTasksUrl);
    expect((post.request.body as any).description).toBe('');
    post.flush({ id: 1, ...post.request.body });

    expect(component.tasks[0].description).toBe('');
  });
});