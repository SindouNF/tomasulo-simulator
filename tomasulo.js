// guardara as configuracoes que serao passadas para o programa
// configuracoes possiveis: num de ciclos de determinado tipo de instrucao
// (ld || sd || multd || divd || addd || subd || add || daddui || beq || bnez) + cycles
let config = {
    "LDcycles": 0,
    "SDcycles": 0,
    "MULTDcycles": 0,
    "DIVDcycles": 0,
    "ADDDcycles": 0,
    "SUBDcycles": 0,
    "ADDcycles": 0,
    "DADDUIcycles": 0,
    "BEQcycles": 0,
    "BNEZcycles": 0,
    "qtyInstr": 0,
    "exec": "fast" // fast or slow
};


class Instruction {
    constructor(inst) {
        // inst = OPCODE RESTO
        inst = inst.split(" ");
        this.opcode = inst[0];
        this.resto = inst[1].split(","); // guarda registradores e/ou label
        // usar o switch para definir exatamente o que terá em cada caso
        switch(this.opcode) {
            case "SD":
                this.type = "S";
                break;
            case "LD": 
                this.type = "L";
                break;
            case "MULTD":
            case "DIVD":
            case "ADDD":
            case "SUBD":
                this.type = "F";
                break;
            case "ADD":
            case "DADDUI":
                this.type = "R";
                break;
            case "BEQ":
            case "BNEZ":
                this.type = "B";
                break;
        }
        this.cycles = config[opcode + "cycles"];

    }
}

class ReservationStation {
    constructor() {
        this.busy = false;
        this.opcode = null;
        this.vj = null;
        this.vk = null;
        this.qj = null;
        this.qk = null;
        this.time = null; // implementar o tempo do ciclo dentro das estações
    }

    add_instruction(instruction, rstations) {
        this.busy = true;
        this.opcode = instruction.opcode;
        if (typeof rstations !== undefined) { // para obter overload no método
            // verifica se existem stations que estão usando os registradores da instrução
            // para colocar em vj e vk
        } 

        // qj e qk guardam registradores ?

        this.time = instruction.cycles;
    }

    is_busy() {
        return this.busy;
    }
}

// Unidade de carregamento 
class LoadStoreUnit {
    constructor() {
        this.busy = false;
        this.address = null;
        //this.FunctUnit = null; estado atual dos registradores na unidade
    }
}

// Qi - the reservation station whose result should be stored in this register (if blank or 0, no values are destined for this register)
class RegisterStatus {
    constructor() {
        this.registers = [];
        this.registers_fp = [];
        this.initialize();
    }

    initialize() {
        for (let i = 0; i < 8; i++) {
            this.registers[i] = new Register("R" + i);
            this.registers_fp[i] = new Register("F" + (i * 2))
        }
    }
}

// classe para representar um registrador
// guarda um nome de registrador (Ri, i = [0 - 7]) e (F(i * 2), i = 0 - 7)
// e a station que está utilizando ele 
class Register {
    // talvez inutil, mas whatever
    constructor(name) {
        this.name = name;
        this.station = null;
    }
}

// TODO: não sei se seria melhor abordagem, nem se ExeUnit faz sentido neste caso
// mas seria a classe que segura todas as reservation stations
class ExeUnit {
    constructor() {
        this.integer_unit = []; // 3
        this.float_add_sub_unit = []; // 3
        this.float_mult_div_unit = []; // 2
        this.store_unit = []; // 3
        this.load_unit = []; // 6

        this.initialize();
    }
    initialize() {
        for (let i = 0; i < 3; i++) {
            // inicializando unidade de inteiro
            this.integer_unit.push(new ReservationStation()); 
            // inicializando unidade de ponto flutuante - addsub
            this.float_add_sub_unit.push(new ReservationStation());
            // inicializando unidade de store
            this.store_unit.push(new ReservationStation());
            // inicializando unidade de load
            this.load_unit.push(new ReservationStation());
            this.load_unit.push(new ReservationStation());
        }
        for (let i = 0; i < 2; i++) {
            // inicializando unidade de ponto flutuante - multdiv
            this.float_mult_div_unit.push(new ReservationStation()); 
        }
    }
}

// a classe que junta tudo
class Tomasulo {
    constructor() {
        this.execution_unit = new ExeUnit(); 
        this.instructions;
    }
    add_instructions(instructions) {
        this.instructions = instructions;
    }

    issue() {};
    execute() {};
    write() {};
}

class Queue {
    constructor(inst) {
        this.q = [];
    }

    peek() {
        return this.q[0];
    }

    push_back(obj) {
        this.q.push(obj);
    }

    pop_front() {
        return this.q.shift();
    }

    empty() {
        return Array.isArray(this.q) && this.q.length() === 0;
    }
}

function read_file() {
    var text;
    $.get( "exemplos/1.txt", function(data) {
        text = data;
    });
    alert(text);
}

function help() {
    a = "Dicas de uso: \nPara inserir uma intrução na unidade escolha as instruções a serem utilizadas e seus respectivos registradores, então clique em 'CONFIRMAR' para executar os dados ou 'RESET' para limpar os campos\n\nO botão 'Próximo' avançará para o proximo ciclo e o botão 'Resultado' apresenta o resultado final da execução do algoritmo";
    alert(a);
}

// pega instruction da entrada, joga para a reservation station e executa
