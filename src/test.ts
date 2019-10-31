import * as ts from 'typescript';
import * as fs from 'fs';
import * as vscode from 'vscode';

let file = vscode.Uri.parse('./src/modules/jenkins/allure-analyze.ts');
let dir = vscode.Uri.parse('./src/modules/jenkins/');
console.log(file);
console.log(dir);